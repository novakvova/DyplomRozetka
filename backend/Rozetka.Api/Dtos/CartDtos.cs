namespace Rozetka.Api.Dtos;

public record CartItemDto(Guid Id, int Quantity, ProductDto Product);
public record CartDto(IReadOnlyList<CartItemDto> Items, decimal Total);
public record CartItemRequest(Guid ProductId, int Quantity);
