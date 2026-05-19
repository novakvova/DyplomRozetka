using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Rozetka.Api.Data;
using Rozetka.Api.Dtos;

namespace Rozetka.Api.Controllers;

[ApiController]
[Route("api/catalog")]
public class CatalogController(AppDbContext db) : ControllerBase
{
    [HttpGet("categories")]
    public async Task<IReadOnlyList<CategoryDto>> Categories()
    {
        var categories = await db.Categories
            .OrderBy(item => item.Title)
            .ToListAsync();

        return categories.Select(item => item.ToDto()).ToList();
    }

    [HttpGet("products")]
    public async Task<IReadOnlyList<ProductDto>> Products(
        [FromQuery] string? category,
        [FromQuery] string? search,
        [FromQuery] string? brand)
    {
        var query = db.Products.Include(item => item.Category).AsQueryable();

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

        var products = await query
            .OrderBy(item => item.Title)
            .ToListAsync();

        return products.Select(item => item.ToDto()).ToList();
    }

    [HttpGet("products/{id:guid}")]
    public async Task<ActionResult<ProductDto>> Product(Guid id)
    {
        var product = await db.Products.Include(item => item.Category).SingleOrDefaultAsync(item => item.Id == id);
        return product is null ? NotFound() : product.ToDto();
    }
}
