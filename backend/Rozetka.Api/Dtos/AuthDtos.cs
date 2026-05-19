using Rozetka.Api.Models;

namespace Rozetka.Api.Dtos;

public record RegisterRequest(string Email, string Password, string FullName, string Phone, string City);
public record LoginRequest(string Email, string Password);
public record PasswordRecoveryRequest(string Email, string NewPassword);
public record ChangePasswordRequest(string CurrentPassword, string NewPassword);
public record ProfileUpdateRequest(string FullName, string Phone, string City);
public record GoogleLoginRequest(string Email, string FullName, string GoogleToken);
public record UserDto(Guid Id, string Email, string FullName, string Phone, string City, UserRole Role, bool IsBlocked);
public record AuthResponse(string Token, UserDto User);
