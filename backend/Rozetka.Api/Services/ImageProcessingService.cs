using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Formats.Webp;
using SixLabors.ImageSharp.Processing;

namespace Rozetka.Api.Services;

public record ProcessedImage(string ThumbnailUrl, string MediumUrl, string LargeUrl);

public class ImageProcessingService(IWebHostEnvironment environment)
{
    private const long MaxFileSizeBytes = 10 * 1024 * 1024;

    private static readonly HashSet<string> AllowedContentTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "image/jpeg", "image/png", "image/webp", "image/gif", "image/bmp"
    };

    private static readonly (string Name, int Width)[] Sizes =
    {
        ("thumbnail", 240),
        ("medium", 640),
        ("large", 1280)
    };

    public async Task<ProcessedImage> ProcessAsync(IFormFile file, CancellationToken cancellationToken = default)
    {
        if (file.Length == 0)
        {
            throw new InvalidOperationException("Файл порожній.");
        }

        if (file.Length > MaxFileSizeBytes)
        {
            throw new InvalidOperationException("Файл завеликий (максимум 10 МБ).");
        }

        if (!AllowedContentTypes.Contains(file.ContentType))
        {
            throw new InvalidOperationException("Непідтримуваний формат зображення. Дозволені: JPEG, PNG, WebP, GIF, BMP.");
        }

        var webRoot = environment.WebRootPath ?? Path.Combine(AppContext.BaseDirectory, "wwwroot");
        var uploadsRoot = Path.Combine(webRoot, "uploads", "products");
        Directory.CreateDirectory(uploadsRoot);

        var fileId = Guid.NewGuid().ToString("N");
        var urls = new Dictionary<string, string>();

        await using var sourceStream = file.OpenReadStream();
        using var source = await Image.LoadAsync(sourceStream, cancellationToken);

        foreach (var (name, width) in Sizes)
        {
            var targetWidth = Math.Min(width, source.Width);
            using var resized = source.Clone(context => context.Resize(new ResizeOptions
            {
                Mode = ResizeMode.Max,
                Size = new Size(targetWidth, 0)
            }));

            var fileName = $"{fileId}-{name}.webp";
            var filePath = Path.Combine(uploadsRoot, fileName);
            await resized.SaveAsync(filePath, new WebpEncoder { Quality = 82 }, cancellationToken);
            urls[name] = $"/uploads/products/{fileName}";
        }

        return new ProcessedImage(urls["thumbnail"], urls["medium"], urls["large"]);
    }

    public void DeleteByUrl(string relativeUrl)
    {
        if (string.IsNullOrWhiteSpace(relativeUrl) || !relativeUrl.StartsWith("/uploads/", StringComparison.OrdinalIgnoreCase))
        {
            return;
        }

        var webRoot = environment.WebRootPath ?? Path.Combine(AppContext.BaseDirectory, "wwwroot");
        var filePath = Path.Combine(webRoot, relativeUrl.TrimStart('/').Replace('/', Path.DirectorySeparatorChar));

        if (File.Exists(filePath))
        {
            File.Delete(filePath);
        }
    }
}