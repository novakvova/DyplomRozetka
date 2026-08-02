using SkiaSharp;
using Rozetka.Api.Common;

namespace Rozetka.Api.Services;

public record ProcessedImage(string ThumbnailUrl, string MediumUrl, string LargeUrl);

public class ImageProcessingService(IWebHostEnvironment environment)
{
    private const int WebpQuality = 82;

    private static readonly HashSet<string> AllowedContentTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif",
        "image/bmp",
        "image/x-ms-bmp",
        "image/x-icon",
        "image/vnd.microsoft.icon",
        "image/avif",
        "image/heic",
        "image/heif",
    };

    private static readonly (string Name, int Width)[] Sizes =
    {
        ("thumbnail", 240),
        ("medium", 640),
        ("large", 1280)
    };

    public async Task<ProcessedImage> ProcessAsync
        (IFormFile file, 
        CancellationToken cancellationToken = default)
    {
        if (file.Length == 0)
        {
            throw new InvalidOperationException("Файл порожній.");
        }

        if (file.Length > ValidationConstants.MaxProductImageBytes)
        {
            throw new InvalidOperationException("Файл завеликий (максимум 10 МБ).");
        }

        if (!AllowedContentTypes.Contains(file.ContentType))
        {
            throw new InvalidOperationException("Непідтримуваний формат зображення. Дозволені: JPEG, PNG, WebP, GIF, BMP, ICO, AVIF, HEIC.");
        }

        var webRoot = environment.WebRootPath ?? Path.Combine
            (AppContext.BaseDirectory, "wwwroot");

        var uploadsRoot = Path.Combine(webRoot, "uploads", "products");
        Directory.CreateDirectory(uploadsRoot);

        var fileId = Guid.NewGuid().ToString("N");
        var urls = new Dictionary<string, string>();

        await using var sourceStream = file.OpenReadStream();
        using var memoryStream = new MemoryStream();
        await sourceStream.CopyToAsync(memoryStream, cancellationToken);
        memoryStream.Position = 0;

        // Перевірка реального формату файлу по сигнатурі (magic bytes),
        // а не лише по Content-Type, який контролює клієнт.
        var detectedFormat = FileSignatureValidator.DetectFormat(memoryStream);
        if (detectedFormat == ImageFileFormat.Unknown)
        {
            throw new InvalidOperationException("Формат файлу не розпізнано або не підтримується.");
        }

        memoryStream.Position = 0;

        using var source = SKBitmap.Decode(memoryStream)
            ?? throw new InvalidOperationException("Не вдалося обробити зображення.");

        foreach (var (name, width) in Sizes)
        {
            var targetWidth = Math.Min(width, source.Width);
            var scale = targetWidth / (double)source.Width;
            var targetHeight = Math.Max(1, (int)Math.Round(source.Height * scale));

            using var resized = source.Resize(
                new SKImageInfo(targetWidth, targetHeight, SKColorType.Rgba8888, SKAlphaType.Premul),
                new SKSamplingOptions(SKFilterMode.Linear, SKMipmapMode.Linear))
                ?? throw new InvalidOperationException("Не вдалося змінити розмір зображення.");

            using var image = SKImage.FromBitmap(resized);
            using var data = image.Encode(SKEncodedImageFormat.Webp, WebpQuality);

            var fileName = $"{fileId}-{name}.webp";
            var filePath = Path.Combine(uploadsRoot, fileName);

            await using var fileStream = File.Create(filePath);
            data.SaveTo(fileStream);

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