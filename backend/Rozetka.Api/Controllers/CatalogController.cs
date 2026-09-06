using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Rozetka.Api.Data;
using Rozetka.Api.Dtos;

namespace Rozetka.Api.Controllers;

[ApiController]
[Route("api/catalog")]
public class CatalogController(AppDbContext db)
    : ControllerBase
{
    [HttpGet("categories")]
    public async Task<IReadOnlyList<CategoryDto>> Categories
        (CancellationToken cancellationToken)
    {
        var categories = await db.Categories
            .OrderBy(item => item.Title)
            .ToListAsync(cancellationToken);

        return categories.Select(item => item.ToDto()).ToList();
    }

    [HttpGet("products")]
    public async Task<PagedResultDto<ProductDto>> Products(
        [FromQuery] string? category,
        [FromQuery] string? search,
        [FromQuery] string? brand,
        [FromQuery] string? sort,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 24,
        CancellationToken cancellationToken = default)
    {
        var query = db.Products
            .Include(item => item.Category)
            .Include(item => item.Images)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(category))
        {
            query = query.Where(item => item.Category!.Slug == category);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var normalized = search.Trim().ToLower();

            query = query.Where(item =>
                item.Title.ToLower().Contains(normalized) ||
                item.Brand.ToLower().Contains(normalized) ||
                item.Subtitle.ToLower().Contains(normalized));
        }

        if (!string.IsNullOrWhiteSpace(brand))
        {
            query = query.Where(item => item.Brand == brand);
        }

        query = sort switch
        {
            "price_asc" => query.OrderBy(item => item.Price),
            "price_desc" => query.OrderByDescending(item => item.Price),
            "rating" => query.OrderByDescending(item => item.Rating).ThenByDescending(item => item.ReviewsCount),
            "newest" => query.OrderByDescending(item => item.CreatedAt),
            _ => query.OrderBy(item => item.Title),
        };

        page = page < 1 ? 1 : page;
        pageSize = pageSize is < 1 or > 100 ? 24 : pageSize;

        var totalCount = await query.CountAsync(cancellationToken);

        var products = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return new PagedResultDto<ProductDto>(
            products.Select(item => item.ToDto()).ToList(),
            page,
            pageSize,
            totalCount,
            pageSize == 0 ? 0 : (int)Math.Ceiling(totalCount / (double)pageSize));
    }

    [HttpGet("products/{id:guid}")]
    public async Task<ActionResult<ProductDto>> Product
        (Guid id, CancellationToken cancellationToken)
    {
        var product = await db.Products
            .Include(item => item.Category)
            .Include(item => item.Images)
            .SingleOrDefaultAsync(item => item.Id == id, cancellationToken);

        return product is null ? NotFound() : product.ToDto();
    }
}