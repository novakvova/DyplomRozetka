namespace Rozetka.Api.Dtos;

public record CategoryDto(Guid Id, string Slug, string Title, string Description);
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

public record CategoryUpsertRequest(string Slug, string Title, string Description);
public record FavoriteDto(Guid Id, ProductDto Product, DateTime CreatedAt);
public record ReviewDto(Guid Id, Guid ProductId, string UserFullName, int Rating, string Text, DateTime CreatedAt);
public record ReviewCreateRequest(Guid ProductId, int Rating, string Text);
