using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Diagnostics;

namespace Rozetka.Api.Middleware;

public class ImageProcessingExceptionHandler
    (ILogger<ImageProcessingExceptionHandler> logger) 
    : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync
        (HttpContext httpContext, Exception exeption,
        CancellationToken cancellationToken)
    {
        if ( exeption is not InvalidOperationException)
        {
            return false;
        }
        logger.LogWarning(exeption, "Rejected an invalid image upload request");
        httpContext.Response.StatusCode = StatusCodes.Status400BadRequest;
        await httpContext.Response.WriteAsJsonAsync(
            new ProblemDetails
            {
                Status = StatusCodes.Status400BadRequest,
                Title = "Не вдалося обробити файл.",
                Detail = exeption.Message
            },
            cancellationToken);
        return true;
    }
}
