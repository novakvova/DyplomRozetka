using Rozetka.Api.Common;
using Rozetka.Api.Models;
using Rozetka.Api.Data;

namespace Rozetka.Api.Dtos;

public static class Mapping
{
    public static UserDto ToDto(this User user, IEnumerable<string> roles) =>
        new(
            user.Id,
            user.Email ?? string.Empty,
            user.FullName,
            user.PhoneNumber ?? string.Empty,
            user.City,
            roles.Contains(Roles.Admin) ? Roles.Admin : Roles.User,
            user.IsBlocked,
            user.BirthDate,
            user.Gender,
            user.TwoFactorEnabled);

    public static CategoryDto ToDto(this Category category) =>
        new(category.Id, category.Slug, category.Title, category.Description, category.ImageUrl);

    public static ProductImageDto ToDto(this ProductImage image) =>
        new(image.Id, image.ThumbnailUrl, image.MediumUrl, image.LargeUrl, image.SortOrder);

    public static ProductDto ToDto(this Product product) =>
        new(
            product.Id,
            product.Sku,
            product.Title,
            product.Subtitle,
            product.Brand,
            product.Price,
            product.PreviousPrice,
            product.Badge,
            product.Rating,
            product.ReviewsCount,
            product.ImageUrl,
            ProductAssets.ImageUrls(product),
            product.Images.OrderBy(image => image.SortOrder).Select(image => image.ToDto()).ToList(),
            product.Description,
            product.ManufacturerUrl,
            product.Specifications,
            product.StockQuantity,
            product.Category!.ToDto());

    public static FavoriteDto ToDto(this FavoriteItem favorite) =>
        new(favorite.Id, favorite.Product!.ToDto(), favorite.CreatedAt);

    public static ReviewDto ToDto(this Review review) =>
        new(review.Id, review.ProductId, review.User?.FullName ?? "Користувач Rozetka", review.Rating, review.Text, review.CreatedAt);

    public static CartDto ToCartDto(this IEnumerable<CartItem> items)
    {
        var cartItems = items
            .Select(item => new CartItemDto(item.Id, item.Quantity, item.Product!.ToDto()))
            .ToList();

        return new CartDto(cartItems, cartItems.Sum(item => item.Product.Price * item.Quantity));
    }

    public static OrderDto ToDto(this Order order) =>
        new(
            order.Id,
            order.Number,
            order.RecipientFullName,
            order.RecipientPhone,
            order.City,
            order.DeliveryPoint,
            order.PaymentMethod,
            order.Comment,
            order.Status,
            order.Total,
            order.CreatedAt,
            order.Items.Select(item => new OrderItemDto(item.Id, item.ProductTitle, item.UnitPrice, item.Quantity)).ToList());
}