namespace Rozetka.Api.Services;

public static class AuthCookie
{
    public const string Name = "rozetka_auth";

    private static CookieOptions Build(HttpRequest request, DateTimeOffset? expires)
    {
        var secure = request.IsHttps;

        return new CookieOptions
        {
            HttpOnly = true,
            Secure = secure,
            SameSite = secure ? SameSiteMode.None : SameSiteMode.Lax,
            Path = "/",
            IsEssential = true,
            Expires = expires
        };
    }

    public static void Append(HttpContext context, string token)
    {
        context.Response.Cookies.Append(Name, token, Build(context.Request, DateTimeOffset.UtcNow.AddDays(7)));
    }

    public static void Delete(HttpContext context)
    {
        context.Response.Cookies.Delete(Name, Build(context.Request, null));
    }
}