namespace Rozetka.Api.Dtos;

public record RegisterRequest(
    string Email,
    string Password,
    string FullName,
    string Phone,
    string City,
    DateOnly? BirthDate = null,
    string? Gender = null);
public record LoginRequest(string Email, string Password);
public record PasswordRecoveryRequest(string Email, string NewPassword);
public record ChangePasswordRequest(string CurrentPassword, string NewPassword);
public record TwoFactorRequest(bool Enabled, string? Password);
public record TwoFactorEnableRequest(string Code);
public record TwoFactorLoginRequest(string Email, string Password, string Code);
public record TwoFactorSetupResponse(string Secret, string OtpAuthUri);
public record ProfileUpdateRequest(string FullName, string Phone, string Email, string City, DateOnly? BirthDate, string? Gender);
public record GoogleLoginRequest(string Email, string FullName, string GoogleToken);

public record UserDto(Guid Id, string Email, string FullName, string Phone, string City, string Role, bool IsBlocked, DateOnly? BirthDate, string? Gender, bool TwoFactorEnabled, string? AvatarUrl);
public record AuthResponse(string Token, UserDto User);
public record LoginResult(bool RequiresTwoFactor, string? Token, UserDto? User, bool EmailSent = false, string? MaskedEmail = null);