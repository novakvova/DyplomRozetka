namespace Rozetka.Api.Models;

public class Order
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Number { get; set; } = string.Empty;
    public Guid UserId { get; set; }
    public User? User { get; set; }
    public string RecipientFullName { get; set; } = string.Empty;
    public string RecipientPhone { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string DeliveryPoint { get; set; } = string.Empty;
    public string PaymentMethod { get; set; } = "card";
    public string Comment { get; set; } = string.Empty;
    public OrderStatus Status { get; set; } = OrderStatus.Placed;
    public decimal Total { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public ICollection<OrderItem> Items { get; set; } = new List<OrderItem>();
}
