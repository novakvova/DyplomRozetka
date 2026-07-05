namespace Rozetka.Api.Dtos;

public record ProductImageDto(Guid Id, string ThumbnailUrl, string MediumUrl, string LargeUrl, int SortOrder);