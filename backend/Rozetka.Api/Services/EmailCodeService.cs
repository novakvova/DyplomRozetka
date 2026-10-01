using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Caching.Memory;

namespace Rozetka.Api.Services;

public enum EmailCodeSendStatus
{
    Sent,
    Cooldown,
    Failed
}

public class EmailCodeService(IMemoryCache cache, EmailService emailService)
{
    private static readonly TimeSpan CodeLifetime = TimeSpan.FromMinutes(5);
    private static readonly TimeSpan ResendCooldown = TimeSpan.FromSeconds(30);
    private const int MaxAttempts = 5;
    private const int CodeLength = 6;

    private sealed class CodeEntry
    {
        public required string Hash { get; init; }
        public required DateTimeOffset SentAt { get; init; }
        public int Attempts { get; set; }
    }

    public async Task<EmailCodeSendStatus> SendLoginCodeAsync(Guid userId, string email, CancellationToken cancellationToken)
    {
        var key = CacheKey(userId);

        if (cache.TryGetValue(key, out CodeEntry? existing)
            && existing is not null
            && DateTimeOffset.UtcNow - existing.SentAt < ResendCooldown)
        {
            return EmailCodeSendStatus.Cooldown;
        }

        var code = RandomNumberGenerator.GetInt32(0, 1_000_000).ToString("D6");
        var entry = new CodeEntry { Hash = Hash(userId, code), SentAt = DateTimeOffset.UtcNow };
        cache.Set(key, entry, CodeLifetime);

        var sent = await emailService.SendAsync(email, "Код підтвердження входу — Lumio", BuildBody(code), cancellationToken);
        if (!sent)
        {
            cache.Remove(key);
            return EmailCodeSendStatus.Failed;
        }

        return EmailCodeSendStatus.Sent;
    }

    public bool Verify(Guid userId, string? code)
    {
        var key = CacheKey(userId);
        if (!cache.TryGetValue(key, out CodeEntry? entry) || entry is null)
        {
            return false;
        }

        var normalized = new string((code ?? string.Empty).Where(char.IsDigit).ToArray());
        if (normalized.Length != CodeLength)
        {
            return false;
        }

        lock (entry)
        {
            if (entry.Attempts >= MaxAttempts)
            {
                cache.Remove(key);
                return false;
            }

            entry.Attempts++;

            var matches = CryptographicOperations.FixedTimeEquals(
                Encoding.ASCII.GetBytes(Hash(userId, normalized)),
                Encoding.ASCII.GetBytes(entry.Hash));

            if (matches)
            {
                cache.Remove(key);
            }

            return matches;
        }
    }

    public void Clear(Guid userId) => cache.Remove(CacheKey(userId));

    private static string CacheKey(Guid userId) => $"login-2fa-email:{userId:N}";

    private static string Hash(Guid userId, string code)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes($"{userId:N}:{code}"));
        return Convert.ToHexString(bytes);
    }

    private static string BuildBody(string code) => $"""
        <div style="font-family:Arial,sans-serif;max-width:420px;margin:0 auto;padding:24px;border:1px solid #e5e7eb;border-radius:14px">
          <h2 style="margin:0 0 8px">Підтвердження входу</h2>
          <p style="margin:0 0 16px;color:#555">Введіть цей код на сайті Lumio, щоб завершити вхід в акаунт:</p>
          <div style="font-size:34px;font-weight:800;letter-spacing:8px;text-align:center;padding:14px;background:#f4f5f7;border-radius:10px">{code}</div>
          <p style="margin:16px 0 0;color:#777;font-size:13px">Код дійсний 5 хвилин. Якщо це були не ви — просто проігноруйте цей лист і змініть пароль.</p>
        </div>
        """;
}
