using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Rozetka.Api.Common;
using Rozetka.Api.Data;
using Rozetka.Api.Models;
using Rozetka.Api.Services;

namespace Rozetka.Api.Controllers;

public record UserAddressDto(
    Guid Id,
    string AddressType,
    string RecipientName,
    string Phone,
    string Country,
    string City,
    string PostalCode,
    string Street,
    string House,
    string Apartment,
    string Notes,
    bool IsDefault);

public record UserAddressRequest(
    string AddressType,
    string RecipientName,
    string Phone,
    string Country,
    string City,
    string PostalCode,
    string Street,
    string House,
    string? Apartment,
    string? Notes,
    bool IsDefault);

[ApiController]
[Route("api/addresses")]
[Authorize]
public class AddressesController(AppDbContext db) : ControllerBase
{
    private static UserAddressDto ToDto(UserAddress address) =>
        new(address.Id,
            address.AddressType,
            address.RecipientName,
            address.Phone,
            address.Country,
            address.City,
            address.PostalCode,
            address.Street,
            address.House,
            address.Apartment,
            address.Notes,
            address.IsDefault);

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<UserAddressDto>>> Get(CancellationToken cancellationToken)
    {
        var userId = CurrentUser.GetUserId(User);

        var addresses = await db.UserAddresses
            .Where(item => item.UserId == userId)
            .OrderByDescending(item => item.IsDefault)
            .ThenBy(item => item.CreatedAt)
            .ToListAsync(cancellationToken);

        return addresses.Select(ToDto).ToList();
    }

    [HttpPost]
    public async Task<ActionResult<UserAddressDto>> Create(UserAddressRequest request, CancellationToken cancellationToken)
    {
        var userId = CurrentUser.GetUserId(User);

        var address = new UserAddress
        {
            UserId = userId,
            AddressType = request.AddressType.Trim(),
            RecipientName = request.RecipientName.Trim(),
            Phone = request.Phone.Trim(),
            Country = request.Country.Trim(),
            City = request.City.Trim(),
            PostalCode = request.PostalCode.Trim(),
            Street = request.Street.Trim(),
            House = request.House.Trim(),
            Apartment = (request.Apartment ?? string.Empty).Trim(),
            Notes = (request.Notes ?? string.Empty).Trim(),
            IsDefault = request.IsDefault,
        };

        if (address.IsDefault)
        {
            await ClearDefaultAsync(userId, cancellationToken);
        }

        db.UserAddresses.Add(address);
        await db.SaveChangesAsync(cancellationToken);

        return ToDto(address);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<UserAddressDto>> Update(Guid id, UserAddressRequest request, CancellationToken cancellationToken)
    {
        var userId = CurrentUser.GetUserId(User);

        var address = await db.UserAddresses
            .SingleOrDefaultAsync(item => item.Id == id && item.UserId == userId, cancellationToken);

        if (address is null)
        {
            return NotFound();
        }

        address.AddressType = request.AddressType.Trim();
        address.RecipientName = request.RecipientName.Trim();
        address.Phone = request.Phone.Trim();
        address.Country = request.Country.Trim();
        address.City = request.City.Trim();
        address.PostalCode = request.PostalCode.Trim();
        address.Street = request.Street.Trim();
        address.House = request.House.Trim();
        address.Apartment = (request.Apartment ?? string.Empty).Trim();
        address.Notes = (request.Notes ?? string.Empty).Trim();

        if (request.IsDefault && !address.IsDefault)
        {
            await ClearDefaultAsync(userId, cancellationToken);
        }

        address.IsDefault = request.IsDefault;
        await db.SaveChangesAsync(cancellationToken);

        return ToDto(address);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var userId = CurrentUser.GetUserId(User);

        var address = await db.UserAddresses
            .SingleOrDefaultAsync(item => item.Id == id && item.UserId == userId, cancellationToken);

        if (address is null)
        {
            return NotFound();
        }

        db.UserAddresses.Remove(address);
        await db.SaveChangesAsync(cancellationToken);

        return NoContent();
    }

    private async Task ClearDefaultAsync(Guid userId, CancellationToken cancellationToken)
    {
        var existing = await db.UserAddresses
            .Where(item => item.UserId == userId && item.IsDefault)
            .ToListAsync(cancellationToken);

        foreach (var item in existing)
        {
            item.IsDefault = false;
        }
    }
}