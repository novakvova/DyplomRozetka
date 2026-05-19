using System.Security.Claims;

namespace Rozetka.Api.Services;

public static class CurrentUser
{
    public static Guid GetUserId(ClaimsPrincipal user)
    {
        var rawId = user.FindFirstValue(ClaimTypes.NameIdentifier);
        return Guid.TryParse(rawId, out var id) ? id : throw new UnauthorizedAccessException();
    }
}
