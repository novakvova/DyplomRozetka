using Microsoft.AspNetCore.Identity;

namespace Rozetka.Api.Models;

public class User : IdentityUser<Guid>
{
    public string FullName { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;

    public bool IsBlocked { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<CartItem> CartItems { get; set; } = new List<CartItem>();
    public ICollection<Order> Orders { get; set; } = new List<Order>();
    public ICollection<FavoriteItem> Favorites { get; set; } = new List<FavoriteItem>();
    public ICollection<Review> Reviews { get; set; } = new List<Review>();
}