using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Rozetka.Api.Common;
using Rozetka.Api.Dtos;
using Rozetka.Api.Models;
using Rozetka.Api.Options;
using Rozetka.Api.Services;

namespace Rozetka.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(UserManager<User> userManager, JwtTokenService jwtTokenService, IOptions<AuthOptions> authOptions) : ControllerBase
{
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

        return new AuthResponse(jwtTokenService.CreateToken(user, roles), user.ToDto(roles));
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login(LoginRequest request)
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

        var roles = await userManager.GetRolesAsync(user);
        return new AuthResponse(jwtTokenService.CreateToken(user, roles), user.ToDto(roles));
    }

    [HttpPost("google")]
    public async Task<ActionResult<AuthResponse>> Google(GoogleLoginRequest request)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(request.GoogleToken))
        {
            return BadRequest("Не вдалося підтвердити Google-вхід.");
        }

        var user = await userManager.FindByEmailAsync(email);
        if (user is null)
        {
            user = new User
            {
                UserName = email,
                Email = email,
                FullName = string.IsNullOrWhiteSpace(request.FullName) ? "Google користувач" : request.FullName.Trim(),
                PhoneNumber = "",
                City = ""
            };

            var createResult = await userManager.CreateAsync(user, Guid.NewGuid().ToString("N"));
            if (!createResult.Succeeded)
            {
                return BadRequest(DescribeErrors(createResult));
            }

            await userManager.AddToRoleAsync(user, Roles.User);
        }

        if (user.IsBlocked)
        {
            return Forbid(ErrorMessages.UserBlocked);
        }

        var roles = await userManager.GetRolesAsync(user);
        return new AuthResponse(jwtTokenService.CreateToken(user, roles), user.ToDto(roles));
    }

    [HttpPost("recover")]
    public async Task<IActionResult> Recover(PasswordRecoveryRequest request)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        var user = await userManager.FindByEmailAsync(email);
        if (user is null)
        {
            return NotFound("Користувача з таким email не знайдено.");
        }

        var removeResult = await userManager.RemovePasswordAsync(user);
        if (!removeResult.Succeeded)
        {
            return BadRequest(DescribeErrors(removeResult));
        }

        var addResult = await userManager.AddPasswordAsync(user, request.NewPassword);
        if (!addResult.Succeeded)
        {
            return BadRequest(DescribeErrors(addResult));
        }

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

        user.FullName = request.FullName.Trim();
        user.PhoneNumber = request.Phone.Trim();
        user.City = request.City.Trim();

        await userManager.UpdateAsync(user);

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
    [HttpPut("two-factor")]
    public async Task<ActionResult<UserDto>> SetTwoFactor(TwoFactorRequest request)
    {
        var userId = CurrentUser.GetUserId(User);
        var user = await userManager.FindByIdAsync(userId.ToString());
        if (user is null)
        {
            return Unauthorized();
        }

        if (!request.Enabled)
        {
            if (string.IsNullOrWhiteSpace(request.Password) || !await userManager.CheckPasswordAsync(user, request.Password))
            {
                return BadRequest("Невірний пароль.");
            }
        }

        await userManager.SetTwoFactorEnabledAsync(user, request.Enabled);

        var roles = await userManager.GetRolesAsync(user);
        return user.ToDto(roles);
    }

    private static string DescribeErrors(IdentityResult result) =>
        string.Join(" ", result.Errors.Select(error => error.Description));
}