using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Rozetka.Api.Common;
using Rozetka.Api.Data;
using Rozetka.Api.Dtos;
using Rozetka.Api.Models;
using Rozetka.Api.Services;

namespace Rozetka.Api.Controllers;

[ApiController]
[Route("api/reviews")]
public class ReviewsController(AppDbContext db) 
    : ControllerBase
{
    [HttpGet("product/{productId:guid}")]
    public async Task<IReadOnlyList<ReviewDto>> ByProduct
        (Guid productId, CancellationToken cancellationToken)
    {
        var reviews = await db.Reviews
            .Include(item => item.User)
            .Where(item => item.ProductId == productId)
            .OrderByDescending(item => item.CreatedAt)
            .ToListAsync(cancellationToken);

        return reviews.Select(item => item.ToDto()).ToList();
    }

    [Authorize]
    [HttpPost]
    public async Task<ActionResult<ReviewDto>> Create
        (ReviewCreateRequest request, CancellationToken cancellationToken)
    {
        var product = await db.Products.SingleOrDefaultAsync
            (item => item.Id == request.ProductId, cancellationToken);

        if (product is null)
        {
            return NotFound(ErrorMessages.ProductNotFound);
        }

        var review = new Review
        {
            UserId = CurrentUser.GetUserId(User),
            ProductId = request.ProductId,
            Rating = Math.Clamp(request.Rating, 
            ValidationConstants.MinReviewLength,
            ValidationConstants.MaxReviewLength),

            Text = request.Text.Trim()
        };

        db.Reviews.Add(review);
        await db.SaveChangesAsync(cancellationToken);

        product.ReviewsCount = await db.Reviews.CountAsync
            (item => item.ProductId == product.Id, cancellationToken);

        product.Rating = await db.Reviews
            .Where(item => item.ProductId == product.Id)
            .AverageAsync(item => item.Rating, cancellationToken);

        await db.SaveChangesAsync(cancellationToken );

        await db.Entry(review)
            .Reference(item => item.User)
            .LoadAsync(cancellationToken);

        return review.ToDto();
    }
}
