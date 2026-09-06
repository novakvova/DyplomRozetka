namespace Rozetka.Api.Dtos;

public record CategoryDto(Guid Id, string Slug, string Title, string Description, string ImageUrl);
public record PagedResultDto<T>(IReadOnlyList<T> Items, int Page, int PageSize, int TotalCount, int TotalPages);
public record ProductDto(
    Guid Id,
    string Sku,
    string Title,
    string Subtitle,
    string Brand,
    decimal Price,
    decimal? PreviousPrice,
    string Badge,
    double Rating,
    int ReviewsCount,
    string ImageUrl,
    IReadOnlyList<string> ImageUrls,
    IReadOnlyList<ProductImageDto> Images,
    string Description,
    string ManufacturerUrl,
    string Specifications,
    int StockQuantity,
    CategoryDto Category);

public record ProductUpsertRequest(
    string Sku,
    string Title,
    string Subtitle,
    string Brand,
    decimal Price,
    decimal? PreviousPrice,
    string Badge,
    string ImageUrl,
    string Description,
    string ManufacturerUrl,
    string Specifications,
    int StockQuantity,
    Guid CategoryId);

public class CategoryUpsertForm
{
    public string Slug { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public IFormFile? Image { get; set; }
}
public record FavoriteDto(Guid Id, ProductDto Product, DateTime CreatedAt);
public record ReviewDto(Guid Id, Guid ProductId, string UserFullName, int Rating, string Text, DateTime CreatedAt);
public record ReviewCreateRequest(Guid ProductId, int Rating, string Text);