using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Rozetka.Api.Data;
using Rozetka.Api.Dtos;
using Rozetka.Api.Models;

namespace Rozetka.Api.Controllers;

[Authorize(Roles = "Admin")]
[ApiController]
[Route("api/admin")]
public class AdminController(AppDbContext db) : ControllerBase
{
    [HttpGet("users")]
    public async Task<IReadOnlyList<UserDto>> Users()
    {
        var users = await db.Users.OrderBy(item => item.Email).ToListAsync();
        return users.Select(item => item.ToDto()).ToList();
    }

    [HttpPost("admins")]
    public async Task<ActionResult<UserDto>> CreateAdmin(RegisterRequest request)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        if (await db.Users.AnyAsync(item => item.Email == email))
        {
            return Conflict("Користувач із таким email вже існує.");
        }

        var user = new User
        {
            Email = email,
            FullName = request.FullName.Trim(),
            Phone = request.Phone.Trim(),
            City = request.City.Trim(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            Role = UserRole.Admin
        };

        db.Users.Add(user);
        await db.SaveChangesAsync();
        return user.ToDto();
    }

    [HttpPut("users/{id:guid}/block")]
    public async Task<ActionResult<UserDto>> ToggleBlock(Guid id)
    {
        var user = await db.Users.FindAsync(id);
        if (user is null)
        {
            return NotFound();
        }

        user.IsBlocked = !user.IsBlocked;
        await db.SaveChangesAsync();
        return user.ToDto();
    }

    [HttpPut("users/{id:guid}/role")]
    public async Task<ActionResult<UserDto>> ToggleRole(Guid id)
    {
        var user = await db.Users.FindAsync(id);
        if (user is null)
        {
            return NotFound();
        }

        user.Role = user.Role == UserRole.Admin ? UserRole.User : UserRole.Admin;
        await db.SaveChangesAsync();
        return user.ToDto();
    }

    [HttpPost("categories")]
    public async Task<ActionResult<CategoryDto>> CreateCategory(CategoryUpsertRequest request)
    {
        var category = new Category
        {
            Slug = request.Slug.Trim().ToLowerInvariant(),
            Title = request.Title.Trim(),
            Description = request.Description.Trim()
        };

        db.Categories.Add(category);
        await db.SaveChangesAsync();
        return category.ToDto();
    }

    [HttpPut("categories/{id:guid}")]
    public async Task<ActionResult<CategoryDto>> UpdateCategory(Guid id, CategoryUpsertRequest request)
    {
        var category = await db.Categories.FindAsync(id);
        if (category is null)
        {
            return NotFound();
        }

        category.Slug = request.Slug.Trim().ToLowerInvariant();
        category.Title = request.Title.Trim();
        category.Description = request.Description.Trim();
        await db.SaveChangesAsync();
        return category.ToDto();
    }

    [HttpDelete("categories/{id:guid}")]
    public async Task<IActionResult> DeleteCategory(Guid id)
    {
        var category = await db.Categories.Include(item => item.Products).SingleOrDefaultAsync(item => item.Id == id);
        if (category is null)
        {
            return NotFound();
        }

        if (category.Products.Any())
        {
            return BadRequest("Не можна видалити категорію, у якій є товари.");
        }

        db.Categories.Remove(category);
        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("products")]
    public async Task<ActionResult<ProductDto>> CreateProduct(ProductUpsertRequest request)
    {
        var category = await db.Categories.FindAsync(request.CategoryId);
        if (category is null)
        {
            return BadRequest("Категорію не знайдено.");
        }

        var product = new Product();
        Apply(product, request);
        db.Products.Add(product);
        await db.SaveChangesAsync();

        product.Category = category;
        return product.ToDto();
    }

    [HttpPut("products/{id:guid}")]
    public async Task<ActionResult<ProductDto>> UpdateProduct(Guid id, ProductUpsertRequest request)
    {
        var product = await db.Products.Include(item => item.Category).SingleOrDefaultAsync(item => item.Id == id);
        if (product is null)
        {
            return NotFound();
        }

        Apply(product, request);
        await db.SaveChangesAsync();
        await db.Entry(product).Reference(item => item.Category).LoadAsync();
        return product.ToDto();
    }

    [HttpDelete("products/{id:guid}")]
    public async Task<IActionResult> DeleteProduct(Guid id)
    {
        var product = await db.Products.FindAsync(id);
        if (product is null)
        {
            return NotFound();
        }

        db.Products.Remove(product);
        await db.SaveChangesAsync();
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
        product.Rating = product.Rating == 0 ? 4.7 : product.Rating;
        product.ReviewsCount = product.ReviewsCount == 0 ? 1 : product.ReviewsCount;
    }
}
