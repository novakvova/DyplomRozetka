using Google.Apis.Auth;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.Extensions.Options;
using Rozetka.Api.Common;
using Rozetka.Api.Dtos;
using Rozetka.Api.Models;
using Rozetka.Api.Options;
using Rozetka.Api.Services;
using System.Text;

namespace Rozetka.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(UserManager<User> userManager, JwtTokenService jwtTokenService, IOptions<AuthOptions> authOptions, ImageProcessingService imageProcessingService, TotpService totpService, EmailCodeService emailCodeService, IOptions<GoogleAuthOptions> googleAuthOptions, EmailService emailService) : ControllerBase
{
    private string IssueAuthCookie(User user, IEnumerable<string> roles)
    {
        AuthCookie.Append(HttpContext, jwtTokenService.CreateToken(user, roles));
        return string.Empty;
    }

    [AllowAnonymous]
    [HttpPost("logout")]
    public IActionResult Logout()
    {
        AuthCookie.Delete(HttpContext);
        return NoContent();
    }

    [HttpPost("register")]
    public async Task<ActionResult<AuthResponse>> Register(RegisterRequest request)
    {
        var email = request.Email.Trim().ToLowerInvariant();

        var user = new User
        {
            UserName = email,
            Email = email,
            FullName = request.FullName.Trim(),
            PhoneNumber = request.Phone.Trim(),
            City = request.City.Trim(),
            BirthDate = request.BirthDate,
            Gender = string.IsNullOrWhiteSpace(request.Gender) ? null : request.Gender.Trim()
        };

        var createResult = await userManager.CreateAsync(user, request.Password);
        if (!createResult.Succeeded)
        {
            if (createResult.Errors.Any(error => error.Code is "DuplicateUserName" or "DuplicateEmail"))
            {
                return Conflict(ErrorMessages.EmailAlreadyExists);
            }

            return BadRequest(DescribeErrors(createResult));
        }

        var isSeedAdmin = string.Equals(email, authOptions.Value.SeedAdminEmail, StringComparison.OrdinalIgnoreCase);
        await userManager.AddToRoleAsync(user, isSeedAdmin ? Roles.Admin : Roles.User);

        var roles = await userManager.GetRolesAsync(user);

        return new AuthResponse(IssueAuthCookie(user, roles), user.ToDto(roles));
    }

    [HttpPost("login")]
    public async Task<ActionResult<LoginResult>> Login(LoginRequest request, CancellationToken cancellationToken)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        var user = await userManager.FindByEmailAsync(email);

        if (user is null || !await userManager.CheckPasswordAsync(user, request.Password))
        {
            return Unauthorized(ErrorMessages.InvalidCredentials);
        }

        if (user.IsBlocked)
        {
            return Forbid(ErrorMessages.UserBlocked);
        }

        if (user.TwoFactorEnabled && !string.IsNullOrWhiteSpace(user.TwoFactorSecret))
        {
            var sendStatus = await emailCodeService.SendLoginCodeAsync(user.Id, user.Email ?? string.Empty, cancellationToken);
            return new LoginResult(true, null, null, sendStatus != EmailCodeSendStatus.Failed, MaskEmail(user.Email));
        }

        var roles = await userManager.GetRolesAsync(user);
        return new LoginResult(false, IssueAuthCookie(user, roles), user.ToDto(roles));
    }

    [HttpPost("login/two-factor/resend")]
    public async Task<ActionResult<LoginResult>> ResendLoginCode(LoginRequest request, CancellationToken cancellationToken)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        var user = await userManager.FindByEmailAsync(email);

        if (user is null || !await userManager.CheckPasswordAsync(user, request.Password))
        {
            return Unauthorized(ErrorMessages.InvalidCredentials);
        }

        if (user.IsBlocked)
        {
            return Forbid(ErrorMessages.UserBlocked);
        }

        if (!user.TwoFactorEnabled || string.IsNullOrWhiteSpace(user.TwoFactorSecret))
        {
            return BadRequest("Для цього акаунта двоетапну автентифікацію не увімкнено.");
        }

        var status = await emailCodeService.SendLoginCodeAsync(user.Id, user.Email ?? string.Empty, cancellationToken);
        if (status == EmailCodeSendStatus.Cooldown)
        {
            return StatusCode(StatusCodes.Status429TooManyRequests, "Зачекайте кілька секунд перед повторним надсиланням коду.");
        }

        return new LoginResult(true, null, null, status == EmailCodeSendStatus.Sent, MaskEmail(user.Email));
    }

    [HttpPost("login/two-factor")]
    public async Task<ActionResult<LoginResult>> LoginTwoFactor(TwoFactorLoginRequest request)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        var user = await userManager.FindByEmailAsync(email);

        if (user is null || !await userManager.CheckPasswordAsync(user, request.Password))
        {
            return Unauthorized(ErrorMessages.InvalidCredentials);
        }

        if (user.IsBlocked)
        {
            return Forbid(ErrorMessages.UserBlocked);
        }

        if (!user.TwoFactorEnabled || string.IsNullOrWhiteSpace(user.TwoFactorSecret))
        {
            return Unauthorized(ErrorMessages.InvalidTwoFactorCode);
        }

        var codeValid = emailCodeService.Verify(user.Id, request.Code)
            || totpService.ValidateCode(user.TwoFactorSecret, request.Code);
        if (!codeValid)
        {
            return Unauthorized(ErrorMessages.InvalidTwoFactorCode);
        }

        emailCodeService.Clear(user.Id);

        var roles = await userManager.GetRolesAsync(user);
        return new LoginResult(false, IssueAuthCookie(user, roles), user.ToDto(roles));
    }

    [HttpPost("google")]
    public async Task<ActionResult<AuthResponse>> Google(GoogleLoginRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Credential))
        {
            return BadRequest("Google credential не передано.");
        }

        GoogleJsonWebSignature.Payload payload;

        try
        {
            payload = await GoogleJsonWebSignature.ValidateAsync(
                request.Credential,
                new GoogleJsonWebSignature.ValidationSettings
                {
                    Audience = new[]
                    {
                    googleAuthOptions.Value.ClientId
                    }
                });
        }
        catch (InvalidJwtException)
        {
            return Unauthorized("Не вдалося підтвердити Google-вхід.");
        }

        if (string.IsNullOrWhiteSpace(payload.Email) ||
            !payload.EmailVerified)
        {
            return Unauthorized("Google email не підтверджено.");
        }

        var email = payload.Email.Trim().ToLowerInvariant();

        var user = await userManager.FindByLoginAsync(
            "Google",
            payload.Subject);

        if (user is null)
        {
            user = await userManager.FindByEmailAsync(email);
        }

        if (user is null)
        {
            user = new User
            {
                UserName = email,
                Email = email,
                FullName = string.IsNullOrWhiteSpace(payload.Name)
                    ? "Google користувач"
                    : payload.Name.Trim(),
                PhoneNumber = string.Empty,
                City = string.Empty
            };

            var createResult = await userManager.CreateAsync(user);

            if (!createResult.Succeeded)
            {
                return BadRequest(DescribeErrors(createResult));
            }

            var roleResult = await userManager.AddToRoleAsync(
                user,
                Roles.User);

            if (!roleResult.Succeeded)
            {
                return BadRequest(DescribeErrors(roleResult));
            }
        }

        if (user.IsBlocked)
        {
            return Forbid(ErrorMessages.UserBlocked);
        }

        var logins = await userManager.GetLoginsAsync(user);

        var hasGoogleLogin = logins.Any(login =>
            login.LoginProvider == "Google" &&
            login.ProviderKey == payload.Subject);

        if (!hasGoogleLogin)
        {
            var loginResult = await userManager.AddLoginAsync(
                user,
                new UserLoginInfo(
                    "Google",
                    payload.Subject,
                    "Google"));

            if (!loginResult.Succeeded)
            {
                return BadRequest(DescribeErrors(loginResult));
            }
        }

        var roles = await userManager.GetRolesAsync(user);

        return new AuthResponse(
            IssueAuthCookie(user, roles),
            user.ToDto(roles));
    }

    [AllowAnonymous]
    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword(
    ForgotPasswordRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Email))
            return BadRequest("Вкажіть електронну пошту.");

        var email = request.Email.Trim().ToLowerInvariant();

        var user = await userManager.FindByEmailAsync(email);

        if (user is null)
            return NoContent();

        var token =
            await userManager.GeneratePasswordResetTokenAsync(user);

        var encodedToken =
            WebEncoders.Base64UrlEncode(
                Encoding.UTF8.GetBytes(token)
            );

        var resetUrl =
            $"{authOptions.Value.FrontendUrl}/reset-password" +
            $"?email={Uri.EscapeDataString(email)}" +
            $"&token={Uri.EscapeDataString(encodedToken)}";

        await emailService.SendPasswordResetEmailAsync(
            email,
            resetUrl
        );

        return NoContent();
    }
    [AllowAnonymous]
    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword(
    ResetPasswordRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Email) ||
            string.IsNullOrWhiteSpace(request.Token) ||
            string.IsNullOrWhiteSpace(request.NewPassword))
        {
            return BadRequest("Некоректні дані.");
        }

        var email = request.Email.Trim().ToLowerInvariant();

        var user = await userManager.FindByEmailAsync(email);

        if (user is null)
            return BadRequest(
                "Посилання для відновлення пароля недійсне."
            );

        string token;

        try
        {
            token = Encoding.UTF8.GetString(
                WebEncoders.Base64UrlDecode(request.Token)
            );
        }
        catch
        {
            return BadRequest(
                "Посилання для відновлення пароля недійсне."
            );
        }

        var result = await userManager.ResetPasswordAsync(
            user,
            token,
            request.NewPassword
        );

        if (!result.Succeeded)
            return BadRequest(DescribeErrors(result));

        return NoContent();
    }

    [Authorize]
    [HttpPut("password")]
    public async Task<IActionResult> ChangePassword(ChangePasswordRequest request)
    {
        var userId = CurrentUser.GetUserId(User);
        var user = await userManager.FindByIdAsync(userId.ToString());
        if (user is null)
        {
            return Unauthorized();
        }

        var result = await userManager.ChangePasswordAsync(user, request.CurrentPassword, request.NewPassword);
        if (!result.Succeeded)
        {
            if (result.Errors.Any(error => error.Code == "PasswordMismatch"))
            {
                return BadRequest("Поточний пароль неправильний.");
            }

            return BadRequest(DescribeErrors(result));
        }

        return NoContent();
    }

    [Authorize]
    [HttpPut("profile")]
    public async Task<ActionResult<UserDto>> UpdateProfile(ProfileUpdateRequest request)
    {
        var userId = CurrentUser.GetUserId(User);
        var user = await userManager.FindByIdAsync(userId.ToString());
        if (user is null)
        {
            return Unauthorized();
        }

        var email = request.Email.Trim();
        if (!string.Equals(user.Email, email, StringComparison.OrdinalIgnoreCase))
        {
            var existing = await userManager.FindByEmailAsync(email);
            if (existing is not null && existing.Id != user.Id)
            {
                return BadRequest("Ця електронна адреса вже використовується.");
            }

            var emailResult = await userManager.SetEmailAsync(user, email);
            if (!emailResult.Succeeded)
            {
                return BadRequest(DescribeErrors(emailResult));
            }

            var usernameResult = await userManager.SetUserNameAsync(user, email);
            if (!usernameResult.Succeeded)
            {
                return BadRequest(DescribeErrors(usernameResult));
            }
        }

        user.FullName = request.FullName.Trim();
        user.PhoneNumber = request.Phone.Trim();
        user.City = request.City.Trim();
        user.BirthDate = request.BirthDate;
        user.Gender = request.Gender;

        var updateResult = await userManager.UpdateAsync(user);
        if (!updateResult.Succeeded)
        {
            return BadRequest(DescribeErrors(updateResult));
        }

        var roles = await userManager.GetRolesAsync(user);
        return user.ToDto(roles);
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<ActionResult<UserDto>> Me()
    {
        var userId = CurrentUser.GetUserId(User);
        var user = await userManager.FindByIdAsync(userId.ToString());
        if (user is null)
        {
            return Unauthorized();
        }

        var roles = await userManager.GetRolesAsync(user);
        return user.ToDto(roles);
    }

    [Authorize]
    [HttpPost("two-factor/setup")]
    public async Task<ActionResult<TwoFactorSetupResponse>> SetupTwoFactor()
    {
        var userId = CurrentUser.GetUserId(User);
        var user = await userManager.FindByIdAsync(userId.ToString());
        if (user is null)
        {
            return Unauthorized();
        }

        if (user.TwoFactorEnabled && !string.IsNullOrWhiteSpace(user.TwoFactorSecret))
        {
            return BadRequest("Двоетапну автентифікацію вже увімкнено.");
        }

        var secret = totpService.GenerateSecret();
        user.TwoFactorSecret = secret;

        var updateResult = await userManager.UpdateAsync(user);
        if (!updateResult.Succeeded)
        {
            return BadRequest(DescribeErrors(updateResult));
        }

        return new TwoFactorSetupResponse(secret, totpService.BuildOtpAuthUri(secret, user.Email ?? user.UserName ?? "user"));
    }

    [Authorize]
    [HttpPost("two-factor/enable")]
    public async Task<ActionResult<UserDto>> EnableTwoFactor(TwoFactorEnableRequest request)
    {
        var userId = CurrentUser.GetUserId(User);
        var user = await userManager.FindByIdAsync(userId.ToString());
        if (user is null)
        {
            return Unauthorized();
        }

        if (string.IsNullOrWhiteSpace(user.TwoFactorSecret))
        {
            return BadRequest("Спочатку розпочніть налаштування 2FA.");
        }

        if (!totpService.ValidateCode(user.TwoFactorSecret, request.Code))
        {
            return BadRequest(ErrorMessages.InvalidTwoFactorCode);
        }

        await userManager.SetTwoFactorEnabledAsync(user, true);

        var roles = await userManager.GetRolesAsync(user);
        return user.ToDto(roles);
    }

    [Authorize]
    [HttpPut("two-factor")]
    public async Task<ActionResult<UserDto>> SetTwoFactor(TwoFactorRequest request)
    {
        var userId = CurrentUser.GetUserId(User);
        var user = await userManager.FindByIdAsync(userId.ToString());
        if (user is null)
        {
            return Unauthorized();
        }

        if (request.Enabled)
        {
            return BadRequest("Для увімкнення 2FA підтвердіть код із застосунку-автентифікатора.");
        }

        if (string.IsNullOrWhiteSpace(request.Password) || !await userManager.CheckPasswordAsync(user, request.Password))
        {
            return BadRequest("Невірний пароль.");
        }

        user.TwoFactorSecret = null;
        await userManager.SetTwoFactorEnabledAsync(user, false);
        await userManager.UpdateAsync(user);

        var roles = await userManager.GetRolesAsync(user);
        return user.ToDto(roles);
    }

    [Authorize]
    [HttpPost("avatar")]
    [RequestSizeLimit(ValidationConstants.MaxProductImageBytes)]
    [Consumes("multipart/form-data")]
    public async Task<ActionResult<UserDto>> UploadAvatar([FromForm] ModelUploadSingleImage model, CancellationToken cancellationToken)
    {
        var userId = CurrentUser.GetUserId(User);
        var user = await userManager.FindByIdAsync(userId.ToString());
        if (user is null)
        {
            return Unauthorized();
        }

        var processed = await imageProcessingService.ProcessAsync(model.File, cancellationToken, "avatars");

        if (!string.IsNullOrWhiteSpace(user.AvatarUrl))
        {
            imageProcessingService.DeleteByUrl(user.AvatarUrl);
        }

        user.AvatarUrl = processed.MediumUrl;

        var updateResult = await userManager.UpdateAsync(user);
        if (!updateResult.Succeeded)
        {
            return BadRequest(DescribeErrors(updateResult));
        }

        var roles = await userManager.GetRolesAsync(user);
        return user.ToDto(roles);
    }

    [Authorize]
    [HttpDelete("avatar")]
    public async Task<ActionResult<UserDto>> DeleteAvatar()
    {
        var userId = CurrentUser.GetUserId(User);
        var user = await userManager.FindByIdAsync(userId.ToString());
        if (user is null)
        {
            return Unauthorized();
        }

        if (!string.IsNullOrWhiteSpace(user.AvatarUrl))
        {
            imageProcessingService.DeleteByUrl(user.AvatarUrl);
            user.AvatarUrl = null;

            var updateResult = await userManager.UpdateAsync(user);
            if (!updateResult.Succeeded)
            {
                return BadRequest(DescribeErrors(updateResult));
            }
        }

        var roles = await userManager.GetRolesAsync(user);
        return user.ToDto(roles);
    }

    private static string? MaskEmail(string? email)
    {
        if (string.IsNullOrWhiteSpace(email))
        {
            return null;
        }

        var atIndex = email.IndexOf('@');
        if (atIndex <= 0)
        {
            return email;
        }

        var name = email[..atIndex];
        var domain = email[atIndex..];
        var visible = name.Length <= 2 ? name[..1] : name[..2];
        return $"{visible}{new string('*', Math.Max(name.Length - visible.Length, 1))}{domain}";
    }

    private static string DescribeErrors(IdentityResult result) =>
        string.Join(" ", result.Errors.Select(error => error.Description));
}