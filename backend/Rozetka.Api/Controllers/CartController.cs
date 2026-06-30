using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
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
    public async Task<CartDto> Get()
    {
        var userId = CurrentUser.GetUserId(User);
        if (!await UserExists(userId))
        {
            Response.StatusCode = StatusCodes.Status401Unauthorized;
            return new CartDto([], 0);
        }

        var items = await LoadCart(userId).ToListAsync();
        return items.ToCartDto();
    }

    [HttpPost("items")]
    public async Task<ActionResult<CartDto>> Add(CartItemRequest request)
    {
        var userId = CurrentUser.GetUserId(User);
        if (!await UserExists(userId))
        {
            return Unauthorized("Сесія застаріла. Увійдіть ще раз.");
        }

        var product = await db.Products.FindAsync(request.ProductId);

        if (product is null)
        {
            return NotFound("Товар не знайдено.");
        }

        var quantity = Math.Clamp(request.Quantity, 1, 99);
        var existing = await db.CartItems.SingleOrDefaultAsync(item => item.UserId == userId && item.ProductId == request.ProductId);

        if (existing is null)
        {
            db.CartItems.Add(new CartItem { UserId = userId, ProductId = request.ProductId, Quantity = quantity });
        }
        else
        {
            existing.Quantity = Math.Clamp(existing.Quantity + quantity, 1, 99);
        }

        await db.SaveChangesAsync();
        return (await LoadCart(userId).ToListAsync()).ToCartDto();
    }

    [HttpPut("items/{id:guid}")]
    public async Task<ActionResult<CartDto>> Update(Guid id, CartItemRequest request)
    {
        var userId = CurrentUser.GetUserId(User);
        if (!await UserExists(userId))
        {
            return Unauthorized("Сесія застаріла. Увійдіть ще раз.");
        }

        var item = await db.CartItems.SingleOrDefaultAsync(cartItem => cartItem.Id == id && cartItem.UserId == userId);

        if (item is null)
        {
            return NotFound();
        }

        item.Quantity = Math.Clamp(request.Quantity, 1, 99);
        await db.SaveChangesAsync();
        return (await LoadCart(userId).ToListAsync()).ToCartDto();
    }

    [HttpDelete("items/{id:guid}")]
    public async Task<ActionResult<CartDto>> Delete(Guid id)
    {
        var userId = CurrentUser.GetUserId(User);
        if (!await UserExists(userId))
        {
            return Unauthorized("Сесія застаріла. Увійдіть ще раз.");
        }

        var item = await db.CartItems.SingleOrDefaultAsync(cartItem => cartItem.Id == id && cartItem.UserId == userId);

        if (item is not null)
        {
            db.CartItems.Remove(item);
            await db.SaveChangesAsync();
        }

        return (await LoadCart(userId).ToListAsync()).ToCartDto();
    }

    private IQueryable<CartItem> LoadCart(Guid userId) =>
        db.CartItems
            .Include(item => item.Product)!.ThenInclude(item => item!.Category)
            .Where(item => item.UserId == userId)
            .OrderBy(item => item.Product!.Title);

    private Task<bool> UserExists(Guid userId) =>
        db.Users.AnyAsync(item => item.Id == userId);
}
