using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Rozetka.Api.Common;
using Rozetka.Api.Models;

namespace Rozetka.Api.Data;

public static class SeedData
{
    public static async Task InitializeAsync(AppDbContext db, UserManager<User> userManager, RoleManager<IdentityRole<Guid>> roleManager)
    {
        await db.Database.EnsureCreatedAsync();
        await EnsureIdentityTablesAsync(db);
        await EnsureProductImagesTableAsync(db);
        await EnsureProductCreatedAtColumnAsync(db);
        await EnsureCategoryImageUrlColumnAsync(db);
        await EnsureCartFavoritesReviewsOrdersTablesAsync(db);
        await EnsureUserAddressesTableAsync(db);
        await EnsureUserProfileColumnsAsync(db);

        await EnsureRoleAsync(roleManager, Roles.Admin);
        await EnsureRoleAsync(roleManager, Roles.User);

        if (!db.Users.Any())
        {
            await CreateSeedUserAsync(userManager, "admin2026@gmail.com", "Admin2026", "Адміністратор Lumio", "+380991112233", "Київ", Roles.Admin);
            await CreateSeedUserAsync(userManager, "user@example.com", "User12345", "Тестовий користувач", "+380671112233", "Львів", Roles.User);
        }

        if (await db.Products.AnyAsync())
        {
            await UpdateSeedProductAssets(db);
            await db.SaveChangesAsync();
            return;
        }

        var existingCategories = await db.Categories.ToListAsync();

        var defaultCategories = new[]
        {
            ("smartphones", "Смартфони", "Apple, Samsung та інші хіти сезону."),
            ("laptops", "Ноутбуки", "Для навчання, роботи й мобільного офісу."),
            ("audio", "Аудіо", "Навушники, колонки й персональний звук."),
            ("gaming", "Геймінг", "Консолі, аксесуари та все для гри."),
            ("home", "Дім", "Техніка для комфорту та затишку."),
            ("accessories", "Аксесуари", "Кабелі, зарядки та корисні дрібниці.")
        };

        foreach (var (slug, title, description) in defaultCategories)
        {
            if (!existingCategories.Any(item => item.Slug == slug))
            {
                var category = new Category { Slug = slug, Title = title, Description = description };
                db.Categories.Add(category);
                existingCategories.Add(category);
            }
        }

        await db.SaveChangesAsync();

        Category C(string slug) => existingCategories.Single(item => item.Slug == slug);

        db.Products.AddRange(
            Product("iphone-15-128-black", "Apple iPhone 15 128GB Black", "Смартфон із Dynamic Island і камерою 48 Мп", C("smartphones"), "Apple", 38999, 40999, "Топ продажів", 4.9, 314, 18, daysAgo: 1),
            Product("galaxy-s24-256", "Samsung Galaxy S24 256GB Onyx Black", "Флагман із Galaxy AI та AMOLED 120 Гц", C("smartphones"), "Samsung", 34999, 36999, "Новинка", 4.8, 221, 24, daysAgo: 2),
            Product("macbook-air-m3-13", "Apple MacBook Air 13 M3 16/512GB", "Легкий ноутбук для продуктивної роботи", C("laptops"), "Apple", 58999, 61999, "Хіт для роботи", 4.9, 142, 11, daysAgo: 5),
            Product("lenovo-legion-5", "Lenovo Legion 5 16IRX9", "Ігровий ноутбук із RTX 4060", C("laptops"), "Lenovo", 52999, 55999, "Для геймінгу", 4.7, 88, 9, daysAgo: 8),
            Product("sony-wh1000xm5", "Sony WH-1000XM5", "Бездротові навушники з активним шумозаглушенням", C("audio"), "Sony", 13999, 15999, "Premium sound", 4.8, 176, 35, daysAgo: 12),
            Product("ps5-slim", "Sony PlayStation 5 Slim", "Консоль нового покоління з SSD", C("gaming"), "Sony", 24999, 26999, "Геймінг", 4.9, 401, 16, daysAgo: 15),
            Product("dyson-v15", "Dyson V15 Detect Absolute", "Акумуляторний пилосос із лазерним підсвічуванням", C("home"), "Dyson", 28999, 30999, "Для дому", 4.7, 64, 7, daysAgo: 20),
            Product("anker-735", "Anker 735 Charger 65W", "Компактний GaN зарядний пристрій", C("accessories"), "Anker", 2499, 2999, "Знижка", 4.6, 97, 80, daysAgo: 25));

        await db.SaveChangesAsync();
    }

    private static async Task EnsureRoleAsync(RoleManager<IdentityRole<Guid>> roleManager, string roleName)
    {
        if (!await roleManager.RoleExistsAsync(roleName))
        {
            await roleManager.CreateAsync(new IdentityRole<Guid>(roleName));
        }
    }

    private static async Task CreateSeedUserAsync(
        UserManager<User> userManager,
        string email,
        string password,
        string fullName,
        string phone,
        string city,
        string role)
    {
        var user = new User
        {
            UserName = email,
            Email = email,
            FullName = fullName,
            PhoneNumber = phone,
            City = city
        };

        var result = await userManager.CreateAsync(user, password);
        if (result.Succeeded)
        {
            await userManager.AddToRoleAsync(user, role);
        }
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
        int stock,
        int daysAgo = 0)
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
            Specifications = $"Бренд: {brand}\nSKU: {sku}\nГарантія: 12 місяців\nНаявність: {stock} шт.",
            CreatedAt = DateTime.UtcNow.AddDays(-daysAgo)
        };
    }

    private static async Task UpdateSeedProductAssets(AppDbContext db)
    {
        var products = await db.Products.ToListAsync();
        foreach (var product in products)
        {
            if (string.IsNullOrWhiteSpace(product.ImageUrl))
            {
                product.ImageUrl = ProductAssets.PrimaryImageUrl(product.Sku, product.Title);
            }
        }
    }

    private static async Task EnsureIdentityTablesAsync(AppDbContext db)
    {
        await db.Database.ExecuteSqlRawAsync("""
            CREATE TABLE IF NOT EXISTS "AspNetRoles" (
                "Id" uuid NOT NULL PRIMARY KEY,
                "Name" varchar(256),
                "NormalizedName" varchar(256),
                "ConcurrencyStamp" text
            );
            CREATE UNIQUE INDEX IF NOT EXISTS "RoleNameIndex" ON "AspNetRoles" ("NormalizedName");

            CREATE TABLE IF NOT EXISTS "AspNetUsers" (
                "Id" uuid NOT NULL PRIMARY KEY,
                "UserName" varchar(256),
                "NormalizedUserName" varchar(256),
                "Email" varchar(256),
                "NormalizedEmail" varchar(256),
                "EmailConfirmed" boolean NOT NULL,
                "PasswordHash" text,
                "SecurityStamp" text,
                "ConcurrencyStamp" text,
                "PhoneNumber" text,
                "PhoneNumberConfirmed" boolean NOT NULL,
                "TwoFactorEnabled" boolean NOT NULL,
                "LockoutEnd" timestamp with time zone,
                "LockoutEnabled" boolean NOT NULL,
                "AccessFailedCount" integer NOT NULL,
                "FullName" varchar(160) NOT NULL DEFAULT '',
                "City" varchar(120) NOT NULL DEFAULT '',
                "IsBlocked" boolean NOT NULL DEFAULT FALSE,
                "CreatedAt" timestamp with time zone NOT NULL DEFAULT NOW()
            );
            CREATE UNIQUE INDEX IF NOT EXISTS "UserNameIndex" ON "AspNetUsers" ("NormalizedUserName");
            CREATE INDEX IF NOT EXISTS "EmailIndex" ON "AspNetUsers" ("NormalizedEmail");

            CREATE TABLE IF NOT EXISTS "AspNetUserRoles" (
                "UserId" uuid NOT NULL,
                "RoleId" uuid NOT NULL,
                PRIMARY KEY ("UserId", "RoleId"),
                CONSTRAINT "FK_AspNetUserRoles_AspNetRoles_RoleId" FOREIGN KEY ("RoleId") REFERENCES "AspNetRoles" ("Id") ON DELETE CASCADE,
                CONSTRAINT "FK_AspNetUserRoles_AspNetUsers_UserId" FOREIGN KEY ("UserId") REFERENCES "AspNetUsers" ("Id") ON DELETE CASCADE
            );
            CREATE INDEX IF NOT EXISTS "IX_AspNetUserRoles_RoleId" ON "AspNetUserRoles" ("RoleId");

            CREATE TABLE IF NOT EXISTS "AspNetUserClaims" (
                "Id" serial NOT NULL PRIMARY KEY,
                "UserId" uuid NOT NULL,
                "ClaimType" text,
                "ClaimValue" text,
                CONSTRAINT "FK_AspNetUserClaims_AspNetUsers_UserId" FOREIGN KEY ("UserId") REFERENCES "AspNetUsers" ("Id") ON DELETE CASCADE
            );
            CREATE INDEX IF NOT EXISTS "IX_AspNetUserClaims_UserId" ON "AspNetUserClaims" ("UserId");

            CREATE TABLE IF NOT EXISTS "AspNetUserLogins" (
                "LoginProvider" text NOT NULL,
                "ProviderKey" text NOT NULL,
                "ProviderDisplayName" text,
                "UserId" uuid NOT NULL,
                PRIMARY KEY ("LoginProvider", "ProviderKey"),
                CONSTRAINT "FK_AspNetUserLogins_AspNetUsers_UserId" FOREIGN KEY ("UserId") REFERENCES "AspNetUsers" ("Id") ON DELETE CASCADE
            );
            CREATE INDEX IF NOT EXISTS "IX_AspNetUserLogins_UserId" ON "AspNetUserLogins" ("UserId");

            CREATE TABLE IF NOT EXISTS "AspNetUserTokens" (
                "UserId" uuid NOT NULL,
                "LoginProvider" text NOT NULL,
                "Name" text NOT NULL,
                "Value" text,
                PRIMARY KEY ("UserId", "LoginProvider", "Name"),
                CONSTRAINT "FK_AspNetUserTokens_AspNetUsers_UserId" FOREIGN KEY ("UserId") REFERENCES "AspNetUsers" ("Id") ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS "AspNetRoleClaims" (
                "Id" serial NOT NULL PRIMARY KEY,
                "RoleId" uuid NOT NULL,
                "ClaimType" text,
                "ClaimValue" text,
                CONSTRAINT "FK_AspNetRoleClaims_AspNetRoles_RoleId" FOREIGN KEY ("RoleId") REFERENCES "AspNetRoles" ("Id") ON DELETE CASCADE
            );
            CREATE INDEX IF NOT EXISTS "IX_AspNetRoleClaims_RoleId" ON "AspNetRoleClaims" ("RoleId");
            """);
    }

    private static async Task EnsureProductImagesTableAsync(AppDbContext db)
    {
        await db.Database.ExecuteSqlRawAsync("""
            CREATE TABLE IF NOT EXISTS "ProductImages" (
                "Id" uuid NOT NULL PRIMARY KEY,
                "ProductId" uuid NOT NULL,
                "ThumbnailUrl" varchar(500) NOT NULL,
                "MediumUrl" varchar(500) NOT NULL,
                "LargeUrl" varchar(500) NOT NULL,
                "SortOrder" integer NOT NULL,
                "CreatedAt" timestamp with time zone NOT NULL,
                CONSTRAINT "FK_ProductImages_Products_ProductId" FOREIGN KEY ("ProductId") REFERENCES "Products" ("Id") ON DELETE CASCADE
            );
            """);
    }

    private static async Task EnsureProductCreatedAtColumnAsync(AppDbContext db)
    {
        await db.Database.ExecuteSqlRawAsync("""
            ALTER TABLE "Products"
            ADD COLUMN IF NOT EXISTS "CreatedAt" timestamp with time zone NOT NULL DEFAULT NOW();
            """);
    }

    private static async Task EnsureCategoryImageUrlColumnAsync(AppDbContext db)
    {
        await db.Database.ExecuteSqlRawAsync("""
            ALTER TABLE "Categories"
            ADD COLUMN IF NOT EXISTS "ImageUrl" varchar(500) NOT NULL DEFAULT '';
            """);
    }

    private static async Task EnsureUserProfileColumnsAsync(AppDbContext db)
    {
        await db.Database.ExecuteSqlRawAsync("""
            ALTER TABLE "AspNetUsers"
            ADD COLUMN IF NOT EXISTS "BirthDate" date NULL;
            ALTER TABLE "AspNetUsers"
            ADD COLUMN IF NOT EXISTS "Gender" varchar(20) NULL;
            """);
    }

    private static async Task EnsureUserAddressesTableAsync(AppDbContext db)
    {
        await db.Database.ExecuteSqlRawAsync("""
            CREATE TABLE IF NOT EXISTS "UserAddresses" (
                "Id" uuid NOT NULL PRIMARY KEY,
                "UserId" uuid NOT NULL,
                "AddressType" varchar(40) NOT NULL DEFAULT '',
                "RecipientName" varchar(160) NOT NULL DEFAULT '',
                "Phone" varchar(40) NOT NULL DEFAULT '',
                "Country" varchar(80) NOT NULL DEFAULT '',
                "City" varchar(120) NOT NULL DEFAULT '',
                "PostalCode" varchar(20) NOT NULL DEFAULT '',
                "Street" varchar(200) NOT NULL DEFAULT '',
                "House" varchar(40) NOT NULL DEFAULT '',
                "Apartment" varchar(40) NOT NULL DEFAULT '',
                "Notes" varchar(400) NOT NULL DEFAULT '',
                "IsDefault" boolean NOT NULL DEFAULT FALSE,
                "CreatedAt" timestamp with time zone NOT NULL DEFAULT NOW(),
                CONSTRAINT "FK_UserAddresses_AspNetUsers_UserId" FOREIGN KEY ("UserId") REFERENCES "AspNetUsers" ("Id") ON DELETE CASCADE
            );
            CREATE INDEX IF NOT EXISTS "IX_UserAddresses_UserId" ON "UserAddresses" ("UserId");
            """);
    }

    private static async Task EnsureCartFavoritesReviewsOrdersTablesAsync(AppDbContext db)
    {
        await db.Database.ExecuteSqlRawAsync("""
            CREATE TABLE IF NOT EXISTS "CartItems" (
                "Id" uuid NOT NULL PRIMARY KEY,
                "UserId" uuid NOT NULL,
                "ProductId" uuid NOT NULL,
                "Quantity" integer NOT NULL,
                CONSTRAINT "FK_CartItems_AspNetUsers_UserId" FOREIGN KEY ("UserId") REFERENCES "AspNetUsers" ("Id") ON DELETE CASCADE,
                CONSTRAINT "FK_CartItems_Products_ProductId" FOREIGN KEY ("ProductId") REFERENCES "Products" ("Id") ON DELETE RESTRICT
            );
            CREATE UNIQUE INDEX IF NOT EXISTS "IX_CartItems_UserId_ProductId" ON "CartItems" ("UserId", "ProductId");

            CREATE TABLE IF NOT EXISTS "FavoriteItems" (
                "Id" uuid NOT NULL PRIMARY KEY,
                "UserId" uuid NOT NULL,
                "ProductId" uuid NOT NULL,
                "CreatedAt" timestamp with time zone NOT NULL,
                CONSTRAINT "FK_FavoriteItems_AspNetUsers_UserId" FOREIGN KEY ("UserId") REFERENCES "AspNetUsers" ("Id") ON DELETE CASCADE,
                CONSTRAINT "FK_FavoriteItems_Products_ProductId" FOREIGN KEY ("ProductId") REFERENCES "Products" ("Id") ON DELETE RESTRICT
            );
            CREATE UNIQUE INDEX IF NOT EXISTS "IX_FavoriteItems_UserId_ProductId" ON "FavoriteItems" ("UserId", "ProductId");

            CREATE TABLE IF NOT EXISTS "Reviews" (
                "Id" uuid NOT NULL PRIMARY KEY,
                "UserId" uuid NOT NULL,
                "ProductId" uuid NOT NULL,
                "Rating" integer NOT NULL,
                "Text" varchar(1200) NOT NULL,
                "CreatedAt" timestamp with time zone NOT NULL,
                CONSTRAINT "FK_Reviews_AspNetUsers_UserId" FOREIGN KEY ("UserId") REFERENCES "AspNetUsers" ("Id") ON DELETE CASCADE,
                CONSTRAINT "FK_Reviews_Products_ProductId" FOREIGN KEY ("ProductId") REFERENCES "Products" ("Id") ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS "Orders" (
                "Id" uuid NOT NULL PRIMARY KEY,
                "Number" text NOT NULL,
                "UserId" uuid NOT NULL,
                "RecipientFullName" text NOT NULL,
                "RecipientPhone" text NOT NULL,
                "City" text NOT NULL,
                "DeliveryPoint" text NOT NULL,
                "PaymentMethod" text NOT NULL,
                "Comment" text NOT NULL,
                "Status" integer NOT NULL,
                "Total" numeric(12,2) NOT NULL,
                "CreatedAt" timestamp with time zone NOT NULL,
                CONSTRAINT "FK_Orders_AspNetUsers_UserId" FOREIGN KEY ("UserId") REFERENCES "AspNetUsers" ("Id") ON DELETE CASCADE
            );
            CREATE UNIQUE INDEX IF NOT EXISTS "IX_Orders_Number" ON "Orders" ("Number");

            CREATE TABLE IF NOT EXISTS "OrderItems" (
                "Id" uuid NOT NULL PRIMARY KEY,
                "OrderId" uuid NOT NULL,
                "ProductId" uuid NOT NULL,
                "ProductTitle" text NOT NULL,
                "UnitPrice" numeric(12,2) NOT NULL,
                "Quantity" integer NOT NULL,
                CONSTRAINT "FK_OrderItems_Orders_OrderId" FOREIGN KEY ("OrderId") REFERENCES "Orders" ("Id") ON DELETE CASCADE,
                CONSTRAINT "FK_OrderItems_Products_ProductId" FOREIGN KEY ("ProductId") REFERENCES "Products" ("Id") ON DELETE RESTRICT
            );
            """);
    }
}