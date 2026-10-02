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
            .Include(item => item.Reactions)
            .Where(item => item.ProductId == productId)
            .OrderByDescending(item => item.CreatedAt)
            .ToListAsync(cancellationToken);

        Guid? currentUserId = User.Identity?.IsAuthenticated == true ? CurrentUser.GetUserId(User) : null;

        return reviews.Select(item => item.ToDto(currentUserId)).ToList();
    }

    [Authorize]
    [HttpPut("{id:guid}/reaction")]
    public async Task<ActionResult<ReviewDto>> React
        (Guid id, ReviewReactionRequest request, CancellationToken cancellationToken)
    {
        var userId = CurrentUser.GetUserId(User);

        bool? isLike = request.Reaction switch
        {
            "like" => true,
            "dislike" => false,
            _ => null
        };

        if (isLike is null)
        {
            return BadRequest("Невідомий тип реакції.");
        }

        var review = await db.Reviews
            .Include(item => item.User)
            .Include(item => item.Reactions)
            .SingleOrDefaultAsync(item => item.Id == id, cancellationToken);

        if (review is null)
        {
            return NotFound("Відгук не знайдено.");
        }

        if (review.UserId == userId)
        {
            return BadRequest("Не можна оцінювати власний відгук.");
        }

        var existing = review.Reactions.FirstOrDefault(item => item.UserId == userId);

        if (existing is null)
        {
            db.ReviewReactions.Add(new ReviewReaction
            {
                ReviewId = review.Id,
                UserId = userId,
                IsLike = isLike.Value
            });
        }
        else if (existing.IsLike == isLike.Value)
        {
            db.ReviewReactions.Remove(existing);
        }
        else
        {
            existing.IsLike = isLike.Value;
        }

        await db.SaveChangesAsync(cancellationToken);

        return review.ToDto(userId);
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

        await db.SaveChangesAsync(cancellationToken);

        await db.Entry(review)
            .Reference(item => item.User)
            .LoadAsync(cancellationToken);

        return review.ToDto();
    }
}