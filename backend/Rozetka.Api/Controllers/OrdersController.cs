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
[Route("api/orders")]
public class OrdersController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IReadOnlyList<OrderDto>> Get()
    {
        var userId = CurrentUser.GetUserId(User);
        var orders = await db.Orders
            .Include(item => item.Items)
            .Where(item => item.UserId == userId)
            .OrderByDescending(item => item.CreatedAt)
            .ToListAsync();

        return orders.Select(item => item.ToDto()).ToList();
    }

    [HttpPost("checkout")]
    public async Task<ActionResult<OrderDto>> Checkout(CheckoutRequest request)
    {
        var userId = CurrentUser.GetUserId(User);
        var cart = await db.CartItems
            .Include(item => item.Product)
            .Where(item => item.UserId == userId)
            .ToListAsync();

        if (cart.Count == 0)
        {
            return BadRequest("Кошик порожній.");
        }

        var now = DateTime.UtcNow;
        var order = new Order
        {
            Number = $"RZ-{now:yyMMdd-HHmmss}",
            UserId = userId,
            RecipientFullName = request.RecipientFullName.Trim(),
            RecipientPhone = request.RecipientPhone.Trim(),
            City = request.City.Trim(),
            DeliveryPoint = request.DeliveryPoint.Trim(),
            PaymentMethod = request.PaymentMethod.Trim(),
            Comment = request.Comment.Trim(),
            Total = cart.Sum(item => item.Product!.Price * item.Quantity),
            CreatedAt = now,
            Items = cart.Select(item => new OrderItem
            {
                ProductId = item.ProductId,
                ProductTitle = item.Product!.Title,
                UnitPrice = item.Product.Price,
                Quantity = item.Quantity
            }).ToList()
        };

        db.Orders.Add(order);
        db.CartItems.RemoveRange(cart);
        await db.SaveChangesAsync();

        return order.ToDto();
    }
}
