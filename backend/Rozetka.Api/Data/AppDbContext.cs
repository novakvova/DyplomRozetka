using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Rozetka.Api.Models;

namespace Rozetka.Api.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options)
    : IdentityDbContext<User, IdentityRole<Guid>, Guid>(options)
{
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<CartItem> CartItems => Set<CartItem>();
    public DbSet<FavoriteItem> FavoriteItems => Set<FavoriteItem>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderItem> OrderItems => Set<OrderItem>();
    public DbSet<Review> Reviews => Set<Review>();
    public DbSet<ProductImage> ProductImages => Set<ProductImage>();
    public DbSet<UserAddress> UserAddresses => Set<UserAddress>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<User>(entity =>
        {
            entity.Property(item => item.FullName).HasMaxLength(160);
            entity.Property(item => item.City).HasMaxLength(120);
        });

        modelBuilder.Entity<Category>(entity =>
        {
            entity.HasIndex(item => item.Slug).IsUnique();
            entity.Property(item => item.Slug).HasMaxLength(80);
            entity.Property(item => item.Title).HasMaxLength(120);
            entity.Property(item => item.Description).HasMaxLength(300);
        });

        modelBuilder.Entity<Product>(entity =>
        {
            entity.HasIndex(item => item.Sku).IsUnique();
            entity.Property(item => item.Price).HasPrecision(12, 2);
            entity.Property(item => item.PreviousPrice).HasPrecision(12, 2);
            entity.Property(item => item.Sku).HasMaxLength(100);
            entity.Property(item => item.Title).HasMaxLength(220);
            entity.Property(item => item.Brand).HasMaxLength(100);
            entity.Property(item => item.ManufacturerUrl).HasMaxLength(500);
            entity.HasOne(item => item.Category)
                .WithMany(item => item.Products)
                .HasForeignKey(item => item.CategoryId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<CartItem>(entity =>
        {
            entity.HasIndex(item => new { item.UserId, item.ProductId }).IsUnique();
            entity.HasOne(item => item.User)
                .WithMany(item => item.CartItems)
                .HasForeignKey(item => item.UserId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(item => item.Product)
                .WithMany()
                .HasForeignKey(item => item.ProductId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<FavoriteItem>(entity =>
        {
            entity.HasIndex(item => new { item.UserId, item.ProductId }).IsUnique();
            entity.HasOne(item => item.User)
                .WithMany(item => item.Favorites)
                .HasForeignKey(item => item.UserId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(item => item.Product)
                .WithMany()
                .HasForeignKey(item => item.ProductId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Review>(entity =>
        {
            entity.Property(item => item.Text).HasMaxLength(1200);
            entity.HasOne(item => item.User)
                .WithMany(item => item.Reviews)
                .HasForeignKey(item => item.UserId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(item => item.Product)
                .WithMany(item => item.Reviews)
                .HasForeignKey(item => item.ProductId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Order>(entity =>
        {
            entity.HasIndex(item => item.Number).IsUnique();
            entity.Property(item => item.Total).HasPrecision(12, 2);
            entity.HasOne(item => item.User)
                .WithMany(item => item.Orders)
                .HasForeignKey(item => item.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<OrderItem>(entity =>
        {
            entity.Property(item => item.UnitPrice).HasPrecision(12, 2);
            entity.HasOne(item => item.Order)
                .WithMany(item => item.Items)
                .HasForeignKey(item => item.OrderId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(item => item.Product)
                .WithMany()
                .HasForeignKey(item => item.ProductId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<UserAddress>(entity =>
        {
            entity.Property(item => item.AddressType).HasMaxLength(40);
            entity.Property(item => item.RecipientName).HasMaxLength(160);
            entity.Property(item => item.Phone).HasMaxLength(40);
            entity.Property(item => item.Country).HasMaxLength(80);
            entity.Property(item => item.City).HasMaxLength(120);
            entity.Property(item => item.PostalCode).HasMaxLength(20);
            entity.Property(item => item.Street).HasMaxLength(200);
            entity.Property(item => item.House).HasMaxLength(40);
            entity.Property(item => item.Apartment).HasMaxLength(40);
            entity.Property(item => item.Notes).HasMaxLength(400);
            entity.HasOne(item => item.User)
                .WithMany(item => item.Addresses)
                .HasForeignKey(item => item.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<ProductImage>(entity =>
        {
            entity.Property(item => item.ThumbnailUrl).HasMaxLength(500);
            entity.Property(item => item.MediumUrl).HasMaxLength(500);
            entity.Property(item => item.LargeUrl).HasMaxLength(500);
            entity.HasOne(item => item.Product)
                .WithMany(item => item.Images)
                .HasForeignKey(item => item.ProductId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}