using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
namespace Rozetka.Api.Dtos;

public record ProductImageDto(Guid Id, string ThumbnailUrl, string MediumUrl, string LargeUrl, int SortOrder);

public class ModelUploadImage
{
    public Guid Id { get; set; }
    [FromForm]
    public IFormFileCollection File { get; set; } = new FormFileCollection();
}