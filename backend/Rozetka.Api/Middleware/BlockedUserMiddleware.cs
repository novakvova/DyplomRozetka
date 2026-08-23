using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Rozetka.Api.Data;
using Rozetka.Api.Services;

namespace Rozetka.Api.Middleware;

public class BlockedUserMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(HttpContext context, AppDbContext db)
    {
        if (context.User.Identity?.IsAuthenticated == true)
        {
            Guid userId;
            try
            {
                userId = CurrentUser.GetUserId(context.User);
            }
            catch (UnauthorizedAccessException)
            {
                await next(context);
                return;
            }

            var isBlocked = await db.Users
                .Where(item => item.Id == userId)
                .Select(item => item.IsBlocked)
                .SingleOrDefaultAsync();

            if (isBlocked)
            {
                context.Response.StatusCode = StatusCodes.Status403Forbidden;
                await context.Response.WriteAsJsonAsync(new ProblemDetails
                {
                    Status = StatusCodes.Status403Forbidden,
                    Title = "Доступ заблоковано.",
                    Detail = "Користувача заблоковано адміністратором."
                });
                return;
            }
        }

        await next(context);
    }
}