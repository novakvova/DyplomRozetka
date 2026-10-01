using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Rozetka.Api.Common;
using Rozetka.Api.Data;
using Rozetka.Api.Models;
using Rozetka.Api.Services;
using System.Text.RegularExpressions;

namespace Rozetka.Api.Controllers;

public record PaymentCardDto(
    Guid Id,
    string CardholderName,
    string Brand,
    string Last4,
    int ExpiryMonth,
    int ExpiryYear,
    bool IsDefault);

public record PaymentCardRequest(
    string CardholderName,
    string CardNumber,
    int ExpiryMonth,
    int ExpiryYear,
    string Cvv,
    bool IsDefault);

[ApiController]
[Route("api/payment-cards")]
[Authorize]
public class PaymentCardsController(AppDbContext db) : ControllerBase
{
    private static PaymentCardDto ToDto(PaymentCard card) =>
        new(card.Id, card.CardholderName, card.Brand, card.Last4, card.ExpiryMonth, card.ExpiryYear, card.IsDefault);

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<PaymentCardDto>>> Get(CancellationToken cancellationToken)
    {
        var userId = CurrentUser.GetUserId(User);

        var cards = await db.PaymentCards
            .Where(item => item.UserId == userId)
            .OrderByDescending(item => item.IsDefault)
            .ThenBy(item => item.CreatedAt)
            .ToListAsync(cancellationToken);

        return cards.Select(ToDto).ToList();
    }

    [HttpPost]
    public async Task<ActionResult<PaymentCardDto>> Create(PaymentCardRequest request, CancellationToken cancellationToken)
    {
        var cardholderName = request.CardholderName.Trim();
        var digits = Regex.Replace(request.CardNumber, "[^0-9]", "");
        var cvv = Regex.Replace(request.Cvv, "[^0-9]", "");

        if (cardholderName.Length < 2)
        {
            return BadRequest("Вкажіть ім'я власника картки.");
        }

        if (digits.Length < 13 || digits.Length > 19 || !IsValidLuhn(digits))
        {
            return BadRequest("Номер картки виглядає некоректно.");
        }

        if (cvv.Length < 3 || cvv.Length > 4)
        {
            return BadRequest("CVV-код має містити 3 або 4 цифри.");
        }

        if (request.ExpiryMonth is < 1 or > 12)
        {
            return BadRequest("Оберіть коректний місяць дії картки.");
        }

        var now = DateTime.UtcNow;
        var expiry = new DateOnly(request.ExpiryYear, request.ExpiryMonth, 1).AddMonths(1).AddDays(-1);
        if (expiry < DateOnly.FromDateTime(now))
        {
            return BadRequest("Строк дії картки вже минув.");
        }

        var userId = CurrentUser.GetUserId(User);

        var card = new PaymentCard
        {
            UserId = userId,
            CardholderName = cardholderName,
            Brand = DetectBrand(digits),
            Last4 = digits[^4..],
            ExpiryMonth = request.ExpiryMonth,
            ExpiryYear = request.ExpiryYear,
            IsDefault = request.IsDefault,
        };

        var hasExistingCards = await db.PaymentCards.AnyAsync(item => item.UserId == userId, cancellationToken);
        if (card.IsDefault || !hasExistingCards)
        {
            await ClearDefaultAsync(userId, cancellationToken);
            card.IsDefault = true;
        }

        db.PaymentCards.Add(card);
        await db.SaveChangesAsync(cancellationToken);

        return ToDto(card);
    }

    [HttpPut("{id:guid}/default")]
    public async Task<ActionResult<PaymentCardDto>> SetDefault(Guid id, CancellationToken cancellationToken)
    {
        var userId = CurrentUser.GetUserId(User);

        var card = await db.PaymentCards
            .SingleOrDefaultAsync(item => item.Id == id && item.UserId == userId, cancellationToken);

        if (card is null)
        {
            return NotFound();
        }

        await ClearDefaultAsync(userId, cancellationToken);
        card.IsDefault = true;
        await db.SaveChangesAsync(cancellationToken);

        return ToDto(card);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var userId = CurrentUser.GetUserId(User);

        var card = await db.PaymentCards
            .SingleOrDefaultAsync(item => item.Id == id && item.UserId == userId, cancellationToken);

        if (card is null)
        {
            return NotFound();
        }

        var wasDefault = card.IsDefault;
        db.PaymentCards.Remove(card);
        await db.SaveChangesAsync(cancellationToken);

        if (wasDefault)
        {
            var next = await db.PaymentCards
                .Where(item => item.UserId == userId)
                .OrderBy(item => item.CreatedAt)
                .FirstOrDefaultAsync(cancellationToken);

            if (next is not null)
            {
                next.IsDefault = true;
                await db.SaveChangesAsync(cancellationToken);
            }
        }

        return NoContent();
    }

    private async Task ClearDefaultAsync(Guid userId, CancellationToken cancellationToken)
    {
        var existing = await db.PaymentCards
            .Where(item => item.UserId == userId && item.IsDefault)
            .ToListAsync(cancellationToken);

        foreach (var item in existing)
        {
            item.IsDefault = false;
        }
    }

    private static bool IsValidLuhn(string digits)
    {
        var sum = 0;
        var alternate = false;
        for (var i = digits.Length - 1; i >= 0; i--)
        {
            var n = digits[i] - '0';
            if (alternate)
            {
                n *= 2;
                if (n > 9) n -= 9;
            }

            sum += n;
            alternate = !alternate;
        }

        return sum % 10 == 0;
    }

    private static string DetectBrand(string digits)
    {
        if (digits.StartsWith('4'))
        {
            return "Visa";
        }

        if (Regex.IsMatch(digits, "^5[1-5]") || Regex.IsMatch(digits, "^2(2[2-9][1-9]|2[3-9][0-9]{2}|[3-6][0-9]{3}|7[0-1][0-9]{2}|720[0-9])"))
        {
            return "Mastercard";
        }

        return "Card";
    }
}