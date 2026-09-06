using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Rozetka.Api.Common;
using Rozetka.Api.Data;
using Rozetka.Api.Dtos;
using Rozetka.Api.Models;
using Rozetka.Api.Services;

namespace Rozetka.Api.Controllers;

[Authorize(Roles = "Admin")]
[ApiController]
[Route("api/admin")]
public class AdminController(AppDbContext db, UserManager<User> userManager, ImageProcessingService imageProcessingService) : ControllerBase
{
    [HttpGet("users")]
    public async Task<IReadOnlyList<UserDto>> Users(CancellationToken cancellationToken)
    {
        var users = await db.Users.OrderBy(item => item.Email).ToListAsync(cancellationToken);

        var result = new List<UserDto>();
        foreach (var user in users)
        {
            var roles = await userManager.GetRolesAsync(user);
            result.Add(user.ToDto(roles));
        }

        return result;
    }

    [HttpPost("admins")]
    public async Task<ActionResult<UserDto>> CreateAdmin(RegisterRequest request)
    {
        var email = request.Email.Trim().ToLowerInvariant();

        var user = new User
        {
            UserName = email,
            Email = email,
            FullName = request.FullName.Trim(),
            PhoneNumber = request.Phone.Trim(),
            City = request.City.Trim()
        };

        var createResult = await userManager.CreateAsync(user, request.Password);
        if (!createResult.Succeeded)
        {
            if (createResult.Errors.Any(error => error.Code is "DuplicateUserName" or "DuplicateEmail"))
            {
                return Conflict(ErrorMessages.EmailAlreadyExists);
            }

            return BadRequest(string.Join(" ", createResult.Errors.Select(error => error.Description)));
        }

        await userManager.AddToRoleAsync(user, Roles.Admin);

        var roles = await userManager.GetRolesAsync(user);
        return user.ToDto(roles);
    }

    [HttpPut("users/{id:guid}/block")]
    public async Task<ActionResult<UserDto>> ToggleBlock(Guid id, CancellationToken cancellationToken)
    {
        var user = await db.Users.SingleOrDefaultAsync(item => item.Id == id, cancellationToken);
        if (user is null)
        {
            return NotFound();
        }

        user.IsBlocked = !user.IsBlocked;
        await db.SaveChangesAsync(cancellationToken);

        var roles = await userManager.GetRolesAsync(user);
        return user.ToDto(roles);
    }

    [HttpPut("users/{id:guid}/role")]
    public async Task<ActionResult<UserDto>> ToggleRole(Guid id, CancellationToken cancellationToken)
    {
        var user = await db.Users.SingleOrDefaultAsync(item => item.Id == id, cancellationToken);
        if (user is null)
        {
            return NotFound();
        }

        var isAdmin = await userManager.IsInRoleAsync(user, Roles.Admin);
        if (isAdmin)
        {
            await userManager.RemoveFromRoleAsync(user, Roles.Admin);
            await userManager.AddToRoleAsync(user, Roles.User);
        }
        else
        {
            await userManager.RemoveFromRoleAsync(user, Roles.User);
            await userManager.AddToRoleAsync(user, Roles.Admin);
        }

        var roles = await userManager.GetRolesAsync(user);
        return user.ToDto(roles);
    }

    [HttpPost("categories")]
    [RequestSizeLimit(ValidationConstants.MaxProductImageBytes)]
    [Consumes("multipart/form-data")]
    public async Task<ActionResult<CategoryDto>> CreateCategory([FromForm] CategoryUpsertForm request, CancellationToken cancellationToken)
    {
        var category = new Category
        {
            Slug = request.Slug.Trim().ToLowerInvariant(),
            Title = request.Title.Trim(),
            Description = (request.Description ?? string.Empty).Trim()
        };

        if (request.Image is { Length: > 0 })
        {
            var processed = await imageProcessingService.ProcessAsync(request.Image, cancellationToken, "categories");
            category.ImageUrl = processed.MediumUrl;
        }

        db.Categories.Add(category);
        await db.SaveChangesAsync(cancellationToken);
        return category.ToDto();
    }

    [HttpPut("categories/{id:guid}")]
    [RequestSizeLimit(ValidationConstants.MaxProductImageBytes)]
    [Consumes("multipart/form-data")]
    public async Task<ActionResult<CategoryDto>> UpdateCategory(Guid id, [FromForm] CategoryUpsertForm request, CancellationToken cancellationToken)
    {
        var category = await db.Categories.SingleOrDefaultAsync(item => item.Id == id, cancellationToken);
        if (category is null)
        {
            return NotFound();
        }

        category.Slug = request.Slug.Trim().ToLowerInvariant();
        category.Title = request.Title.Trim();
        category.Description = (request.Description ?? string.Empty).Trim();

        if (request.Image is { Length: > 0 })
        {
            if (!string.IsNullOrWhiteSpace(category.ImageUrl))
            {
                imageProcessingService.DeleteByUrl(category.ImageUrl);
            }

            var processed = await imageProcessingService.ProcessAsync(request.Image, cancellationToken, "categories");
            category.ImageUrl = processed.MediumUrl;
        }

        await db.SaveChangesAsync(cancellationToken);
        return category.ToDto();
    }

    [HttpDelete("categories/{id:guid}")]
    public async Task<IActionResult> DeleteCategory(Guid id, CancellationToken cancellationToken)
    {
        var category = await db.Categories
            .Include(item => item.Products)
            .SingleOrDefaultAsync(item => item.Id == id, cancellationToken);

        if (category is null)
        {
            return NotFound();
        }

        if (category.Products.Any())
        {
            return BadRequest(ErrorMessages.CategoryHasProducts);
        }

        if (!string.IsNullOrWhiteSpace(category.ImageUrl))
        {
            imageProcessingService.DeleteByUrl(category.ImageUrl);
        }

        db.Categories.Remove(category);
        await db.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    [HttpPost("products")]
    public async Task<ActionResult<ProductDto>> CreateProduct(ProductUpsertRequest request, CancellationToken cancellationToken)
    {
        var category = await db.Categories.SingleOrDefaultAsync(item => item.Id == request.CategoryId, cancellationToken);
        if (category is null)
        {
            return BadRequest(ErrorMessages.CategoryNotFound);
        }

        var product = new Product();
        Apply(product, request);
        db.Products.Add(product);
        await db.SaveChangesAsync(cancellationToken);

        product.Category = category;
        return product.ToDto();
    }

    [HttpPut("products/{id:guid}")]
    public async Task<ActionResult<ProductDto>> UpdateProduct(Guid id, ProductUpsertRequest request, CancellationToken cancellationToken)
    {
        var product = await db.Products
            .Include(item => item.Category)
            .Include(item => item.Images)
            .SingleOrDefaultAsync(item => item.Id == id, cancellationToken);

        if (product is null)
        {
            return NotFound();
        }

        Apply(product, request);
        await db.SaveChangesAsync(cancellationToken);
        await db.Entry(product).Reference(item => item.Category).LoadAsync(cancellationToken);
        return product.ToDto();
    }

    [HttpDelete("products/{id:guid}")]
    public async Task<IActionResult> DeleteProduct(Guid id, CancellationToken cancellationToken)
    {
        var product = await db.Products.SingleOrDefaultAsync(item => item.Id == id, cancellationToken);
        if (product is null)
        {
            return NotFound();
        }

        db.Products.Remove(product);
        await db.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    [HttpPost("products/{productId:guid}/images")]
    [RequestSizeLimit(ValidationConstants.MaxProductImageBytes)]
    [Consumes("multipart/form-data")]
    public async Task<ActionResult<IReadOnlyList<ProductImageDto>>> UploadImages(Guid productId, [FromForm] ModelUploadImage model, CancellationToken cancellationToken)
    {
        var product = await db.Products
            .Include(item => item.Images)
            .SingleOrDefaultAsync(item => item.Id == productId, cancellationToken);

        if (product is null)
        {
            return NotFound();
        }

        if (model.File.Count == 0)
        {
            return BadRequest("Не передано жодного файлу.");
        }

        var nextSortOrder = product.Images.Count == 0 ? 0 : product.Images.Max(image => image.SortOrder) + 1;

        foreach (var file in model.File)
        {
            var processed = await imageProcessingService.ProcessAsync(file, cancellationToken);

            var image = new ProductImage
            {
                ProductId = product.Id,
                ThumbnailUrl = processed.ThumbnailUrl,
                MediumUrl = processed.MediumUrl,
                LargeUrl = processed.LargeUrl,
                SortOrder = nextSortOrder++
            };

            db.ProductImages.Add(image);
        }

        if (string.IsNullOrWhiteSpace(product.ImageUrl))
        {
            product.ImageUrl = product.Images.OrderBy(image => image.SortOrder).First().LargeUrl;
        }

        await db.SaveChangesAsync(cancellationToken);
        return product.Images.OrderBy(image => image.SortOrder).Select(image => image.ToDto()).ToList();
    }

    [HttpDelete("products/{productId:guid}/images/{imageId:guid}")]
    public async Task<IActionResult> DeleteImage(Guid productId, Guid imageId, CancellationToken cancellationToken)
    {
        var image = await db.ProductImages
            .SingleOrDefaultAsync(item => item.Id == imageId && item.ProductId == productId, cancellationToken);

        if (image is null)
        {
            return NotFound();
        }

        db.ProductImages.Remove(image);
        await db.SaveChangesAsync(cancellationToken);

        imageProcessingService.DeleteByUrl(image.ThumbnailUrl);
        imageProcessingService.DeleteByUrl(image.MediumUrl);
        imageProcessingService.DeleteByUrl(image.LargeUrl);

        return NoContent();
    }

    private static void Apply(Product product, ProductUpsertRequest request)
    {
        product.Sku = request.Sku.Trim();
        product.Title = request.Title.Trim();
        product.Subtitle = request.Subtitle.Trim();
        product.Brand = request.Brand.Trim();
        product.Price = request.Price;
        product.PreviousPrice = request.PreviousPrice;
        product.Badge = request.Badge.Trim();
        product.ImageUrl = request.ImageUrl.Trim();
        product.Description = request.Description.Trim();
        product.ManufacturerUrl = request.ManufacturerUrl.Trim();
        product.Specifications = request.Specifications.Trim();
        product.StockQuantity = request.StockQuantity;
        product.CategoryId = request.CategoryId;
        product.Rating = product.Rating == 0 ? ValidationConstants.DefaultProductRating : product.Rating;
        product.ReviewsCount = product.ReviewsCount == 0 ? ValidationConstants.DefaultProductReviewsCount : product.ReviewsCount;
    }
}