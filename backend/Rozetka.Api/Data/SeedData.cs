using Microsoft.EntityFrameworkCore;
using Rozetka.Api.Models;

namespace Rozetka.Api.Data;

public static class SeedData
{
    public static async Task InitializeAsync(AppDbContext db)
    {
        await db.Database.EnsureCreatedAsync();

        if (!await db.Users.AnyAsync())
        {
            db.Users.AddRange(
                new User
                {
                    Email = "radon.bogdan09@gmail.com",
                    FullName = "Адміністратор Rozetka",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin12345"),
                    Role = UserRole.Admin,
                    City = "Київ",
                    Phone = "+380991112233"
                },
                new User
                {
                    Email = "user@example.com",
                    FullName = "Тестовий користувач",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("User12345"),
                    Role = UserRole.User,
                    City = "Львів",
                    Phone = "+380671112233"
                });
        }

        if (await db.Categories.AnyAsync())
        {
            await UpdateSeedProductAssets(db);
            await db.SaveChangesAsync();
            return;
        }

        var categories = new[]
        {
            new Category { Slug = "smartphones", Title = "Смартфони", Description = "Apple, Samsung та інші хіти сезону." },
            new Category { Slug = "laptops", Title = "Ноутбуки", Description = "Для навчання, роботи й мобільного офісу." },
            new Category { Slug = "audio", Title = "Аудіо", Description = "Навушники, колонки й персональний звук." },
            new Category { Slug = "gaming", Title = "Геймінг", Description = "Консолі, аксесуари та все для гри." },
            new Category { Slug = "home", Title = "Дім", Description = "Техніка для комфорту та затишку." },
            new Category { Slug = "accessories", Title = "Аксесуари", Description = "Кабелі, зарядки та корисні дрібниці." }
        };

        db.Categories.AddRange(categories);
        await db.SaveChangesAsync();

        Category C(string slug) => categories.Single(item => item.Slug == slug);

        db.Products.AddRange(
            Product("iphone-15-128-black", "Apple iPhone 15 128GB Black", "Смартфон із Dynamic Island і камерою 48 Мп", C("smartphones"), "Apple", 38999, 40999, "Топ продажів", 4.9, 314, 18),
            Product("galaxy-s24-256", "Samsung Galaxy S24 256GB Onyx Black", "Флагман із Galaxy AI та AMOLED 120 Гц", C("smartphones"), "Samsung", 34999, 36999, "Новинка", 4.8, 221, 24),
            Product("macbook-air-m3-13", "Apple MacBook Air 13 M3 16/512GB", "Легкий ноутбук для продуктивної роботи", C("laptops"), "Apple", 58999, 61999, "Хіт для роботи", 4.9, 142, 11),
            Product("lenovo-legion-5", "Lenovo Legion 5 16IRX9", "Ігровий ноутбук із RTX 4060", C("laptops"), "Lenovo", 52999, 55999, "Для геймінгу", 4.7, 88, 9),
            Product("sony-wh1000xm5", "Sony WH-1000XM5", "Бездротові навушники з активним шумозаглушенням", C("audio"), "Sony", 13999, 15999, "Premium sound", 4.8, 176, 35),
            Product("ps5-slim", "Sony PlayStation 5 Slim", "Консоль нового покоління з SSD", C("gaming"), "Sony", 24999, 26999, "Геймінг", 4.9, 401, 16),
            Product("dyson-v15", "Dyson V15 Detect Absolute", "Акумуляторний пилосос із лазерним підсвічуванням", C("home"), "Dyson", 28999, 30999, "Для дому", 4.7, 64, 7),
            Product("anker-735", "Anker 735 Charger 65W", "Компактний GaN зарядний пристрій", C("accessories"), "Anker", 2499, 2999, "Знижка", 4.6, 97, 80));

        await db.SaveChangesAsync();
    }

    private static Product Product(
        string sku,
        string title,
        string subtitle,
        Category category,
        string brand,
        decimal price,
        decimal previousPrice,
        string badge,
        double rating,
        int reviews,
        int stock)
    {
        return new Product
        {
            Sku = sku,
            Title = title,
            Subtitle = subtitle,
            CategoryId = category.Id,
            Brand = brand,
            Price = price,
            PreviousPrice = previousPrice,
            Badge = badge,
            Rating = rating,
            ReviewsCount = reviews,
            StockQuantity = stock,
            ImageUrl = ProductAssets.PrimaryImageUrl(sku, title),
            Description = $"{title} доступний у каталозі Rozetka. Дані зберігаються у PostgreSQL, а зміни проходять через ASP.NET Core API.",
            ManufacturerUrl = brand switch
            {
                "Apple" => "https://www.apple.com/",
                "Samsung" => "https://www.samsung.com/",
                "Sony" => "https://www.sony.com/",
                "Lenovo" => "https://www.lenovo.com/",
                "Dyson" => "https://www.dyson.com/",
                "Anker" => "https://www.anker.com/",
                _ => ""
            },
            Specifications = $"Бренд: {brand}\nSKU: {sku}\nГарантія: 12 місяців\nНаявність: {stock} шт."
        };
    }

    private static async Task UpdateSeedProductAssets(AppDbContext db)
    {
        var products = await db.Products.ToListAsync();
        foreach (var product in products)
        {
            product.ImageUrl = ProductAssets.PrimaryImageUrl(product.Sku, product.Title);
        }
    }
}
