using Rozetka.Api.Models;

namespace Rozetka.Api.Dtos;

public record CheckoutRequest(
    string RecipientFullName,
    string RecipientPhone,
    string City,
    string DeliveryPoint,
    string PaymentMethod,
    string Comment);

public record OrderItemDto(Guid Id, string ProductTitle, decimal UnitPrice, int Quantity);

public record OrderDto(
    Guid Id,
    string Number,
    string RecipientFullName,
    string RecipientPhone,
    string City,
    string DeliveryPoint,
    string PaymentMethod,
    string Comment,
    OrderStatus Status,
    decimal Total,
    DateTime CreatedAt,
    IReadOnlyList<OrderItemDto> Items);
