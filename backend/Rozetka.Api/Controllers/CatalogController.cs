using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Rozetka.Api.Data;
using Rozetka.Api.Dtos;
using Rozetka.Api.Models;

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

    private sealed record CatalogFilter(
        string? Category,
        string? Search,
        string[] Brands,
        string[] Conditions,
        string[] Deliveries,
        decimal? MinPrice,
        decimal? MaxPrice);

    private static string[] ParseList(string? value) =>
        string.IsNullOrWhiteSpace(value)
            ? []
            : value.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .Distinct()
                .ToArray();

    private static IQueryable<Product> ApplyFilters(
        IQueryable<Product> query,
        CatalogFilter filter,
        bool skipCategory = false,
        bool skipBrands = false,
        bool skipConditions = false,
        bool skipDeliveries = false,
        bool skipPrice = false)
    {
        if (!skipCategory && !string.IsNullOrWhiteSpace(filter.Category))
        {
            query = query.Where(item => item.Category!.Slug == filter.Category);
        }

        if (!string.IsNullOrWhiteSpace(filter.Search))
        {
            var normalized = filter.Search.Trim().ToLower();

            query = query.Where(item =>
                item.Title.ToLower().Contains(normalized) ||
                item.Brand.ToLower().Contains(normalized) ||
                item.Subtitle.ToLower().Contains(normalized));
        }

        if (!skipBrands && filter.Brands.Length > 0)
        {
            var brands = filter.Brands;
            query = query.Where(item => brands.Contains(item.Brand));
        }

        if (!skipConditions && filter.Conditions.Length > 0)
        {
            var conditions = filter.Conditions;
            query = query.Where(item => conditions.Contains(item.Condition));
        }

        if (!skipDeliveries && filter.Deliveries.Length > 0)
        {
            var today = filter.Deliveries.Contains("today");
            var fast = filter.Deliveries.Contains("fast");
            var week = filter.Deliveries.Contains("week");

            query = query.Where(item =>
                (today && item.DeliveryDays == 0) ||
                (fast && item.DeliveryDays >= 1 && item.DeliveryDays <= 2) ||
                (week && item.DeliveryDays >= 3 && item.DeliveryDays <= 5));
        }

        if (!skipPrice)
        {
            if (filter.MinPrice is { } minPrice)
            {
                query = query.Where(item => item.Price >= minPrice);
            }

            if (filter.MaxPrice is { } maxPrice)
            {
                query = query.Where(item => item.Price <= maxPrice);
            }
        }

        return query;
    }

    private static CatalogFilter BuildFilter(
        string? category,
        string? search,
        string? brand,
        string? brands,
        string? condition,
        string? delivery,
        decimal? minPrice,
        decimal? maxPrice) =>
        new(
            category,
            search,
            ParseList(brands).Concat(ParseList(brand)).Distinct().ToArray(),
            ParseList(condition),
            ParseList(delivery),
            minPrice,
            maxPrice);

    [HttpGet("products")]
    public async Task<PagedResultDto<ProductDto>> Products(
        [FromQuery] string? category,
        [FromQuery] string? search,
        [FromQuery] string? brand,
        [FromQuery] string? brands,
        [FromQuery] string? condition,
        [FromQuery] string? delivery,
        [FromQuery] decimal? minPrice,
        [FromQuery] decimal? maxPrice,
        [FromQuery] string? sort,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 24,
        CancellationToken cancellationToken = default)
    {
        var filter = BuildFilter(category, search, brand, brands, condition, delivery, minPrice, maxPrice);

        var query = ApplyFilters(
            db.Products
                .Include(item => item.Category)
                .Include(item => item.Images)
                .AsQueryable(),
            filter);

        query = sort switch
        {
            "price_asc" => query.OrderBy(item => item.Price),
            "price_desc" => query.OrderByDescending(item => item.Price),
            "rating" => query.OrderByDescending(item => item.Rating).ThenByDescending(item => item.ReviewsCount),
            "newest" => query.OrderByDescending(item => item.CreatedAt),
            _ => query.OrderByDescending(item => item.ReviewsCount).ThenBy(item => item.Title),
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
            (int)Math.Ceiling(totalCount / (double)pageSize));
    }

    [HttpGet("facets")]
    public async Task<CatalogFacetsDto> Facets(
        [FromQuery] string? category,
        [FromQuery] string? search,
        [FromQuery] string? brands,
        [FromQuery] string? condition,
        [FromQuery] string? delivery,
        [FromQuery] decimal? minPrice,
        [FromQuery] decimal? maxPrice,
        CancellationToken cancellationToken = default)
    {
        var filter = BuildFilter(category, search, null, brands, condition, delivery, minPrice, maxPrice);
        var all = db.Products.AsNoTracking();

        var totalCount = await ApplyFilters(all, filter).CountAsync(cancellationToken);

        var categoryRows = await ApplyFilters(all, filter, skipCategory: true)
            .GroupBy(item => new { item.Category!.Slug, item.Category.Title })
            .Select(group => new { group.Key.Slug, group.Key.Title, Count = group.Count() })
            .ToListAsync(cancellationToken);

        var brandRows = await ApplyFilters(all, filter, skipBrands: true)
            .GroupBy(item => item.Brand)
            .Select(group => new { Brand = group.Key, Count = group.Count() })
            .ToListAsync(cancellationToken);

        var conditionRows = await ApplyFilters(all, filter, skipConditions: true)
            .GroupBy(item => item.Condition)
            .Select(group => new { Condition = group.Key, Count = group.Count() })
            .ToListAsync(cancellationToken);

        var deliveryRows = await ApplyFilters(all, filter, skipDeliveries: true)
            .GroupBy(item => item.DeliveryDays)
            .Select(group => new { Days = group.Key, Count = group.Count() })
            .ToListAsync(cancellationToken);

        var priceQuery = ApplyFilters(all, filter, skipPrice: true);
        var hasPrices = await priceQuery.AnyAsync(cancellationToken);
        var minAvailable = hasPrices ? await priceQuery.MinAsync(item => item.Price, cancellationToken) : 0;
        var maxAvailable = hasPrices ? await priceQuery.MaxAsync(item => item.Price, cancellationToken) : 0;

        var brandOptions = brandRows
            .Where(row => !string.IsNullOrWhiteSpace(row.Brand))
            .OrderByDescending(row => row.Count)
            .ThenBy(row => row.Brand)
            .Select(row => new FacetOptionDto(row.Brand, row.Brand, row.Count))
            .ToList();

        var conditionOptions = new List<FacetOptionDto>
        {
            new("new", "Новий", conditionRows.Where(row => row.Condition == "new").Sum(row => row.Count)),
            new("used", "Вживаний", conditionRows.Where(row => row.Condition == "used").Sum(row => row.Count)),
        };

        var deliveryOptions = new List<FacetOptionDto>
        {
            new("today", "Сьогодні", deliveryRows.Where(row => row.Days == 0).Sum(row => row.Count)),
            new("fast", "1-2 дні", deliveryRows.Where(row => row.Days is >= 1 and <= 2).Sum(row => row.Count)),
            new("week", "До 5 днів", deliveryRows.Where(row => row.Days is >= 3 and <= 5).Sum(row => row.Count)),
        };

        return new CatalogFacetsDto(
            Math.Floor(minAvailable),
            Math.Ceiling(maxAvailable),
            totalCount,
            categoryRows
                .OrderByDescending(row => row.Count)
                .ThenBy(row => row.Title)
                .Select(row => new CategoryFacetDto(row.Slug, row.Title, row.Count))
                .ToList(),
            brandOptions,
            conditionOptions,
            deliveryOptions);
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