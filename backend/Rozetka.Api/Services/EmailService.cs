using System.Net;
using System.Net.Mail;
using Microsoft.Extensions.Options;
using Rozetka.Api.Options;

namespace Rozetka.Api.Services;

public class EmailService(
    IOptions<EmailOptions> options)
{
    private readonly EmailOptions _options = options.Value;

    public async Task SendPasswordResetEmailAsync(
        string email,
        string resetUrl)
    {
        using var client = new SmtpClient(
            _options.Host,
            _options.Port)
        {
            EnableSsl = true,
            Credentials = new NetworkCredential(
                _options.UserName,
                _options.Password
            )
        };

        using var message = new MailMessage
        {
            From = new MailAddress(
                _options.FromEmail,
                _options.FromName
            ),

            Subject = "Відновлення пароля Lumio",

            Body = $"""
                <div style="
                    font-family: Arial, sans-serif;
                    max-width: 520px;
                    margin: 0 auto;
                    padding: 32px;
                ">
                    <h1 style="text-align:center;">
                        Lumio
                    </h1>

                    <h2>
                        Відновлення пароля
                    </h2>

                    <p>
                        Ми отримали запит на зміну пароля
                        вашого облікового запису Lumio.
                    </p>

                    <p>
                        Натисніть кнопку нижче, щоб
                        встановити новий пароль.
                    </p>

                    <p style="margin: 30px 0;">
                        <a
                            href="{resetUrl}"
                            style="
                                display:inline-block;
                                background:#f43f25;
                                color:white;
                                padding:14px 24px;
                                border-radius:8px;
                                text-decoration:none;
                                font-weight:bold;
                            "
                        >
                            Відновити пароль
                        </a>
                    </p>

                    <p style="color:#777;">
                        Якщо ви не надсилали цей запит,
                        просто проігноруйте лист.
                    </p>
                </div>
                """,

            IsBodyHtml = true
        };

        message.To.Add(email);

        await client.SendMailAsync(message);
    }
}