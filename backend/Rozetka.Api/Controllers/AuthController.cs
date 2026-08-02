using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Rozetka.Api.Common;
using Rozetka.Api.Data;
using Rozetka.Api.Dtos;
using Rozetka.Api.Models;
using Rozetka.Api.Options;
using Rozetka.Api.Services;

namespace Rozetka.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController
    (AppDbContext db, JwtTokenService jwtTokenService,
    IOptions<AuthOptions> authOptions)
    : ControllerBase
{
    [HttpPost("register")]
    public async Task<ActionResult<AuthResponse>> Register
        (RegisterRequest request, CancellationToken cancellationToken)
    {
        var email = request.Email.Trim().ToLowerInvariant();

        if (request.Password.Length < ValidationConstants.MinPasswordLength)
        {
            return BadRequest(ErrorMessages.PasswordTooShort);
        }

        if (await db.Users.AnyAsync
            (item => item.Email == email, cancellationToken))
        {
            return Conflict(ErrorMessages.EmailAlreadyExists);
        }

        var isSeedAdmin = string.Equals
            (email, authOptions.Value.SeedAdminEmail,
            StringComparison.OrdinalIgnoreCase);

        var user = new User
        {
            Email = email,
            FullName = request.FullName.Trim(),
            Phone = request.Phone.Trim(),
            City = request.City.Trim(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            Role = isSeedAdmin ? UserRole.Admin : UserRole.User
        };

        db.Users.Add(user);
        await db.SaveChangesAsync(cancellationToken);

        return new AuthResponse(jwtTokenService.CreateToken(user), user.ToDto());
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login
        (LoginRequest request, CancellationToken cancellationToken)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        var user = await db.Users.SingleOrDefaultAsync
            (item => item.Email == email, cancellationToken);

        if (user is null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
        {
            return Unauthorized(ErrorMessages.InvalidCredentials);
        }

        if (user.IsBlocked)
        {
            return Forbid(ErrorMessages.UserBlocked);
        }

        return new AuthResponse(jwtTokenService.CreateToken(user), user.ToDto());
    }

    [HttpPost("google")]
    public async Task<ActionResult<AuthResponse>> Google
        (GoogleLoginRequest request, CancellationToken cancellationToken)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(request.GoogleToken))
        {
            return BadRequest("Не вдалося підтвердити Google-вхід.");
        }

        var user = await db.Users.SingleOrDefaultAsync
            (item => item.Email == email, cancellationToken);

        if (user is null)
        {
            user = new User
            {
                Email = email,
                FullName = string.IsNullOrWhiteSpace(request.FullName) ? "Google користувач" : request.FullName.Trim(),
                Phone = "",
                City = "",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(Guid.NewGuid().ToString("N")),
                Role = UserRole.User
            };
            db.Users.Add(user);
            await db.SaveChangesAsync(cancellationToken);
        }

        if (user.IsBlocked)
        {
            return Forbid(ErrorMessages.UserBlocked);
        }

        return new AuthResponse(jwtTokenService.CreateToken(user), user.ToDto());
    }

    [HttpPost("recover")]
    public async Task<IActionResult> Recover
        (PasswordRecoveryRequest request, CancellationToken cancellationToken)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        var user = await db.Users.SingleOrDefaultAsync
            (item => item.Email == email, cancellationToken);

        if (user is null)
        {
            return NotFound("Користувача з таким email не знайдено.");
        }

        if (request.NewPassword.Length < ValidationConstants.MinPasswordLength)
        {
            return BadRequest(ErrorMessages.NewPasswordTooShort);
        }

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword
            (request.NewPassword);

        await db.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    [Authorize]
    [HttpPut("password")]
    public async Task<IActionResult> ChangePassword
        (ChangePasswordRequest request, CancellationToken cancellationToken)
    {
        var userId = CurrentUser.GetUserId(User);
        var user = await db.Users.SingleOrDefaultAsync
            (item => item.Id == userId, cancellationToken);

        if (user is null)
        {
            return Unauthorized();
        }

        if (!BCrypt.Net.BCrypt.Verify(request.CurrentPassword, user.PasswordHash))
        {
            return BadRequest("Поточний пароль неправильний.");
        }

        if (request.NewPassword.Length < ValidationConstants.MinPasswordLength)
        {
            return BadRequest(ErrorMessages.NewPasswordTooShort);
        }

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        await db.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    [Authorize]
    [HttpPut("profile")]
    public async Task<ActionResult<UserDto>> UpdateProfile
        (ProfileUpdateRequest request, CancellationToken cancellationToken)
    {
        var userId = CurrentUser.GetUserId(User);
        var user = await db.Users.SingleOrDefaultAsync
            (item => item.Id == userId, cancellationToken);

        if (user is null)
        {
            return Unauthorized();
        }

        user.FullName = request.FullName.Trim();
        user.Phone = request.Phone.Trim();
        user.City = request.City.Trim();

        await db.SaveChangesAsync(cancellationToken);
        return user.ToDto();
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<ActionResult<UserDto>> Me
        (CancellationToken cancellationToken)
    {
        var userId = CurrentUser.GetUserId(User);
        var user = await db.Users.SingleOrDefaultAsync
            (item => item.Id == userId, cancellationToken);

        return user is null ? Unauthorized() : user.ToDto();
    }
}
