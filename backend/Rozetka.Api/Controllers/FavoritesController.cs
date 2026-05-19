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
[Route("api/favorites")]
public class FavoritesController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IReadOnlyList<FavoriteDto>> Get()
    {
        var userId = CurrentUser.GetUserId(User);
        var favorites = await db.FavoriteItems
            .Include(item => item.Product)!.ThenInclude(item => item!.Category)
            .Where(item => item.UserId == userId)
            .OrderByDescending(item => item.CreatedAt)
            .ToListAsync();

        return favorites.Select(item => item.ToDto()).ToList();
    }

    [HttpPost("{productId:guid}")]
    public async Task<IReadOnlyList<FavoriteDto>> Toggle(Guid productId)
    {
        var userId = CurrentUser.GetUserId(User);
        var existing = await db.FavoriteItems.SingleOrDefaultAsync(item => item.UserId == userId && item.ProductId == productId);

        if (existing is null)
        {
            db.FavoriteItems.Add(new FavoriteItem { UserId = userId, ProductId = productId });
        }
        else
        {
            db.FavoriteItems.Remove(existing);
        }

        await db.SaveChangesAsync();
        return await Get();
    }
}
