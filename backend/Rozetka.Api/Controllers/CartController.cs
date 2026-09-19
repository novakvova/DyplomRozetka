using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Rozetka.Api.Common;
using Rozetka.Api.Data;
using Rozetka.Api.Dtos;
using Rozetka.Api.Models;
using Rozetka.Api.Services;

namespace Rozetka.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/cart")]
public class CartController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<CartDto> Get
        (CancellationToken cancellationToken)
    {
        var userId = CurrentUser.GetUserId(User);

        if (!await UserExists(userId, cancellationToken))
        {
            Response.StatusCode = StatusCodes.Status401Unauthorized;
            return new CartDto([], 0);
        }

        var items = await LoadCart(userId).ToListAsync(cancellationToken);
        return items.ToCartDto();
    }

    [HttpPost("items")]
    public async Task<ActionResult<CartDto>> Add
        (CartItemRequest request, CancellationToken cancellationToken)
    {
        var userId = CurrentUser.GetUserId(User);

        if (!await UserExists(userId, cancellationToken))
        {
            return Unauthorized(ErrorMessages.SessionExpired);
        }

        var product = await db.Products.SingleOrDefaultAsync
            (item => item.Id == request.ProductId, cancellationToken);

        if (product is null)
        {
            return NotFound(ErrorMessages.ProductNotFound);
        }

        var quantity = Math.Clamp(request.Quantity,
            ValidationConstants.MinCartLength,
            ValidationConstants.MaxCartLength);

        var existing = await db.CartItems.SingleOrDefaultAsync
            (item => item.UserId == userId && item.ProductId ==
            request.ProductId, cancellationToken);


        if (existing is null)
        {
            db.CartItems.Add(new CartItem
            {
                UserId = userId,
                ProductId = request.ProductId,
                Quantity = quantity
            });
        }
        else
        {
            existing.Quantity = Math.Clamp
                (existing.Quantity + quantity,
                ValidationConstants.MinCartLength,
                ValidationConstants.MaxCartLength);
        }

        await db.SaveChangesAsync(cancellationToken);

        return (await LoadCart(userId)
            .ToListAsync(cancellationToken))
            .ToCartDto();
    }

    [HttpPut("items/{id:guid}")]
    public async Task<ActionResult<CartDto>> Update
        (Guid id, CartItemRequest request, CancellationToken cancellationToken)
    {
        var userId = CurrentUser.GetUserId(User);

        if (!await UserExists(userId, cancellationToken))
        {
            return Unauthorized(ErrorMessages.SessionExpired);
        }

        var item = await db.CartItems.SingleOrDefaultAsync
            (cartItem => cartItem.Id == id && cartItem.UserId == userId, cancellationToken);

        if (item is null)
        {
            return NotFound();
        }

        item.Quantity = Math.Clamp
            (request.Quantity,
            ValidationConstants.MinCartLength,
            ValidationConstants.MaxCartLength);

        await db.SaveChangesAsync(cancellationToken);

        return (await LoadCart(userId)
            .ToListAsync(cancellationToken))
            .ToCartDto();
    }

    [HttpDelete("items/{id:guid}")]
    public async Task<ActionResult<CartDto>> Delete
        (Guid id, CancellationToken cancellationToken)
    {
        var userId = CurrentUser.GetUserId(User);

        if (!await UserExists(userId, cancellationToken))
        {
            return Unauthorized(ErrorMessages.SessionExpired);
        }

        var item = await db.CartItems.SingleOrDefaultAsync
            (cartItem => cartItem.Id == id && cartItem.UserId == userId,
            cancellationToken);

        if (item is not null)
        {
            db.CartItems.Remove(item);
            await db.SaveChangesAsync(cancellationToken);
        }

        return (await LoadCart(userId)
            .ToListAsync(cancellationToken))
            .ToCartDto();
    }

    [HttpDelete("items")]
    public async Task<ActionResult<CartDto>> Clear(CancellationToken cancellationToken)
    {
        var userId = CurrentUser.GetUserId(User);

        if (!await UserExists(userId, cancellationToken))
        {
            return Unauthorized(ErrorMessages.SessionExpired);
        }

        var items = await db.CartItems
            .Where(cartItem => cartItem.UserId == userId)
            .ToListAsync(cancellationToken);

        if (items.Count > 0)
        {
            db.CartItems.RemoveRange(items);
            await db.SaveChangesAsync(cancellationToken);
        }

        return (await LoadCart(userId)
            .ToListAsync(cancellationToken))
            .ToCartDto();
    }

    private IQueryable<CartItem> LoadCart(Guid userId) =>
        db.CartItems
            .Include(item => item.Product)!.ThenInclude(item => item!.Category)
            .Include(item => item.Product)!.ThenInclude(item => item!.Images)
            .Where(item => item.UserId == userId)
            .OrderBy(item => item.Product!.Title);

    private Task<bool> UserExists
        (Guid userId, CancellationToken cancellationToken) =>
        db.Users.AnyAsync(item => item.Id == userId, cancellationToken);
}