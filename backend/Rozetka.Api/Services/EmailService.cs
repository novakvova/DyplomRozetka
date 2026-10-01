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
                From = new MailAddress(settings.FromAddress, settings.FromName),
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

            if (!string.IsNullOrWhiteSpace(settings.Username))
            {
                client.Credentials = new NetworkCredential(settings.Username, settings.Password);
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
}