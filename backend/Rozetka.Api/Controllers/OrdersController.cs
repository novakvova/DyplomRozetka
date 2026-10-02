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
public class OrdersController(AppDbContext db)
    : ControllerBase
{
    [HttpGet]
    public async Task<IReadOnlyList<OrderDto>> Get
        (CancellationToken cancellationToken)
    {
        var userId = CurrentUser.GetUserId(User);

        var orders = await db.Orders
            .Include(item => item.Items)
            .ThenInclude(orderItem => orderItem.Product)
            .Where(item => item.UserId == userId)
            .OrderByDescending(item => item.CreatedAt)
            .ToListAsync(cancellationToken);

        return orders.Select(item => item.ToDto()).ToList();
    }

    [HttpPost("{id:guid}/cancel")]
    public async Task<IActionResult> Cancel
        (Guid id, CancellationToken cancellationToken)
    {
        var userId = CurrentUser.GetUserId(User);

        var order = await db.Orders
            .Include(item => item.Items)
            .SingleOrDefaultAsync(item => item.Id == id && item.UserId == userId, cancellationToken);

        if (order is null)
        {
            return NotFound("Замовлення не знайдено.");
        }

        if (order.Status is not (OrderStatus.Placed or OrderStatus.Processing))
        {
            return BadRequest("Це замовлення вже не можна скасувати.");
        }

        db.Orders.Remove(order);
        await db.SaveChangesAsync(cancellationToken);

        return NoContent();
    }

    [HttpPost("checkout")]
    public async Task<ActionResult<OrderDto>> Checkout
        (CheckoutRequest request, CancellationToken cancellationToken)
    {
        var userId = CurrentUser.GetUserId(User);
        var cart = await db.CartItems
            .Include(item => item.Product)
            .Where(item => item.UserId == userId)
            .ToListAsync(cancellationToken);

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
                Product = item.Product,
                ProductTitle = item.Product!.Title,
                UnitPrice = item.Product.Price,
                Quantity = item.Quantity
            }).ToList()
        };

        db.Orders.Add(order);
        db.CartItems.RemoveRange(cart);
        await db.SaveChangesAsync(cancellationToken);

        return order.ToDto();
    }
}