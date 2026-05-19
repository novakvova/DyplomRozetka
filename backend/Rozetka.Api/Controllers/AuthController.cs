using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Rozetka.Api.Data;
using Rozetka.Api.Dtos;
using Rozetka.Api.Models;
using Rozetka.Api.Services;

namespace Rozetka.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(AppDbContext db, JwtTokenService jwtTokenService) : ControllerBase
{
    [HttpPost("register")]
    public async Task<ActionResult<AuthResponse>> Register(RegisterRequest request)
    {
        var email = request.Email.Trim().ToLowerInvariant();

        if (request.Password.Length < 8)
        {
            return BadRequest("Пароль має містити щонайменше 8 символів.");
        }

        if (await db.Users.AnyAsync(item => item.Email == email))
        {
            return Conflict("Користувач із таким email вже існує.");
        }

        var user = new User
        {
            Email = email,
            FullName = request.FullName.Trim(),
            Phone = request.Phone.Trim(),
            City = request.City.Trim(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            Role = email == "radon.bogdan09@gmail.com" ? UserRole.Admin : UserRole.User
        };

        db.Users.Add(user);
        await db.SaveChangesAsync();

        return new AuthResponse(jwtTokenService.CreateToken(user), user.ToDto());
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login(LoginRequest request)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        var user = await db.Users.SingleOrDefaultAsync(item => item.Email == email);

        if (user is null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
        {
            return Unauthorized("Невірний email або пароль.");
        }

        if (user.IsBlocked)
        {
            return Forbid("Користувача заблоковано адміністратором.");
        }

        return new AuthResponse(jwtTokenService.CreateToken(user), user.ToDto());
    }

    [HttpPost("google")]
    public async Task<ActionResult<AuthResponse>> Google(GoogleLoginRequest request)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(request.GoogleToken))
        {
            return BadRequest("Не вдалося підтвердити Google-вхід.");
        }

        var user = await db.Users.SingleOrDefaultAsync(item => item.Email == email);
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
            await db.SaveChangesAsync();
        }

        if (user.IsBlocked)
        {
            return Forbid("Користувача заблоковано адміністратором.");
        }

        return new AuthResponse(jwtTokenService.CreateToken(user), user.ToDto());
    }

    [HttpPost("recover")]
    public async Task<IActionResult> Recover(PasswordRecoveryRequest request)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        var user = await db.Users.SingleOrDefaultAsync(item => item.Email == email);
        if (user is null)
        {
            return NotFound("Користувача з таким email не знайдено.");
        }

        if (request.NewPassword.Length < 8)
        {
            return BadRequest("Новий пароль має містити щонайменше 8 символів.");
        }

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        await db.SaveChangesAsync();
        return NoContent();
    }

    [Authorize]
    [HttpPut("password")]
    public async Task<IActionResult> ChangePassword(ChangePasswordRequest request)
    {
        var userId = CurrentUser.GetUserId(User);
        var user = await db.Users.FindAsync(userId);
        if (user is null)
        {
            return Unauthorized();
        }

        if (!BCrypt.Net.BCrypt.Verify(request.CurrentPassword, user.PasswordHash))
        {
            return BadRequest("Поточний пароль неправильний.");
        }

        if (request.NewPassword.Length < 8)
        {
            return BadRequest("Новий пароль має містити щонайменше 8 символів.");
        }

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        await db.SaveChangesAsync();
        return NoContent();
    }

    [Authorize]
    [HttpPut("profile")]
    public async Task<ActionResult<UserDto>> UpdateProfile(ProfileUpdateRequest request)
    {
        var userId = CurrentUser.GetUserId(User);
        var user = await db.Users.FindAsync(userId);
        if (user is null)
        {
            return Unauthorized();
        }

        user.FullName = request.FullName.Trim();
        user.Phone = request.Phone.Trim();
        user.City = request.City.Trim();
        await db.SaveChangesAsync();
        return user.ToDto();
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<ActionResult<UserDto>> Me()
    {
        var userId = CurrentUser.GetUserId(User);
        var user = await db.Users.FindAsync(userId);
        return user is null ? Unauthorized() : user.ToDto();
    }
}
