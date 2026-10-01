using System.Net;
using System.Net.Mail;
using Microsoft.Extensions.Options;
using Rozetka.Api.Options;

namespace Rozetka.Api.Services;

public class EmailService(IOptions<EmailOptions> options, ILogger<EmailService> logger)
{
    public async Task<bool> SendAsync(string to, string subject, string htmlBody, CancellationToken cancellationToken = default)
    {
        var settings = options.Value;
        if (!settings.IsConfigured)
        {
            logger.LogWarning("Email is not configured (section 'Email' in appsettings). Message to {Recipient} was not sent.", to);
            return false;
        }

        try
        {
            using var message = new MailMessage
            {
                From = new MailAddress(settings.FromEmail, settings.FromName),
                Subject = subject,
                Body = htmlBody,
                IsBodyHtml = true
            };
            message.To.Add(to);

            using var client = new SmtpClient(settings.Host, settings.Port)
            {
                EnableSsl = settings.EnableSsl,
                DeliveryMethod = SmtpDeliveryMethod.Network
            };

            if (!string.IsNullOrWhiteSpace(settings.UserName))
            {
                client.Credentials = new NetworkCredential(settings.UserName, settings.Password.Replace(" ", string.Empty));
            }

            await client.SendMailAsync(message, cancellationToken);
            return true;
        }
        catch (Exception exception)
        {
            logger.LogError(exception, "Failed to send email to {Recipient}.", to);
            return false;
        }
    }

    public Task<bool> SendPasswordResetEmailAsync(string to, string resetUrl, CancellationToken cancellationToken = default)
    {
        var safeUrl = WebUtility.HtmlEncode(resetUrl);
        var body = $"""
            <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;">
              <h2>Відновлення пароля — Lumio</h2>
              <p>Ви отримали цей лист, бо було надіслано запит на відновлення пароля.</p>
              <p><a href="{safeUrl}" style="display:inline-block;padding:12px 20px;background:#6c3df4;color:#fff;border-radius:8px;text-decoration:none;">Встановити новий пароль</a></p>
              <p style="color:#777;font-size:13px;">Якщо ви не надсилали цей запит, просто проігноруйте лист.</p>
            </div>
            """;
        return SendAsync(to, "Відновлення пароля — Lumio", body, cancellationToken);
    }
}