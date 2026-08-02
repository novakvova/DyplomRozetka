namespace Rozetka.Api.Common;

public static class ValidationConstants
{
    public const int MinPasswordLength = 8;

    public const int MinCartLength = 1;
    public const int MaxCartLength = 99;
    public const int MinReviewLength = 1;
    public const int MaxReviewLength = 5;

    public const double DefaultProductRating = 4.7;
    public const int DefaultProductReviewsCount = 1;
    public const long MaxProductImageBytes = 10 * 1024 * 1024;

}
