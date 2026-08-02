namespace Rozetka.Api.Options;

public class FrontendCorsOptions
{
    public const string SectionName = "Cors";
    public const string PolicyName = "Frontend";

    public string[] AllowedOrigins { get; set; } = [];
}
