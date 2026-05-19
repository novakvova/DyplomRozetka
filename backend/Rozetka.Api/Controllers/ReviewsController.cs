using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Rozetka.Api.Data;
using Rozetka.Api.Dtos;
using Rozetka.Api.Models;
using Rozetka.Api.Services;

namespace Rozetka.Api.Controllers;

[ApiController]
[Route("api/reviews")]
public class ReviewsController(AppDbContext db) : ControllerBase
{
    [HttpGet("product/{productId:guid}")]
    public async Task<IReadOnlyList<ReviewDto>> ByProduct(Guid productId)
    {
        var reviews = await db.Reviews
            .Include(item => item.User)
            .Where(item => item.ProductId == productId)
            .OrderByDescending(item => item.CreatedAt)
            .ToListAsync();

        return reviews.Select(item => item.ToDto()).ToList();
    }

    [Authorize]
    [HttpPost]
    public async Task<ActionResult<ReviewDto>> Create(ReviewCreateRequest request)
    {
        var product = await db.Products.FindAsync(request.ProductId);
        if (product is null)
        {
            return NotFound("Товар не знайдено.");
        }

        var review = new Review
        {
            UserId = CurrentUser.GetUserId(User),
            ProductId = request.ProductId,
            Rating = Math.Clamp(request.Rating, 1, 5),
            Text = request.Text.Trim()
        };

        db.Reviews.Add(review);
        await db.SaveChangesAsync();

        product.ReviewsCount = await db.Reviews.CountAsync(item => item.ProductId == product.Id);
        product.Rating = await db.Reviews.Where(item => item.ProductId == product.Id).AverageAsync(item => item.Rating);
        await db.SaveChangesAsync();

        await db.Entry(review).Reference(item => item.User).LoadAsync();
        return review.ToDto();
    }
}
