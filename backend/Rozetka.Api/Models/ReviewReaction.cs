namespace Rozetka.Api.Models;

public class ReviewReaction
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ReviewId { get; set; }
    public Review? Review { get; set; }
    public Guid UserId { get; set; }
    public User? User { get; set; }
    public bool IsLike { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}