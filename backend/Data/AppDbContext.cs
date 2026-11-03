using CentroBeneficios.Api.Entities;
using Microsoft.EntityFrameworkCore;

namespace CentroBeneficios.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<PointTransaction> PointTransactions => Set<PointTransaction>();
    public DbSet<Redemption> Redemptions => Set<Redemption>();
    public DbSet<AttendanceEntry> AttendanceEntries => Set<AttendanceEntry>();
    public DbSet<Goal> Goals => Set<Goal>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>(e =>
        {
            e.Property(u => u.Name).HasMaxLength(120).IsRequired();
            e.Property(u => u.Email).HasMaxLength(254).IsRequired();
            e.Property(u => u.PasswordHash).IsRequired();
            e.Property(u => u.Role).HasConversion<string>().HasMaxLength(20);
            e.HasIndex(u => u.Email).IsUnique();
            e.ToTable(t => t.HasCheckConstraint("CK_Users_PointsBalance", "\"PointsBalance\" >= 0"));
        });

        modelBuilder.Entity<Product>(e =>
        {
            e.Property(p => p.Name).HasMaxLength(120).IsRequired();
            e.Property(p => p.Description).HasMaxLength(500);
            e.Property(p => p.Status).HasConversion<string>().HasMaxLength(20);
            e.ToTable(t =>
            {
                t.HasCheckConstraint("CK_Products_StockQuantity", "\"StockQuantity\" >= 0");
                t.HasCheckConstraint("CK_Products_PointCost", "\"PointCost\" >= 0 AND (\"Status\" <> 'Published' OR \"PointCost\" > 0)");
            });
        });

        modelBuilder.Entity<PointTransaction>(e =>
        {
            e.Property(t => t.Description).HasMaxLength(250).IsRequired();
            e.Property(t => t.Type).HasConversion<string>().HasMaxLength(30);
            e.HasIndex(t => new { t.UserId, t.CreatedAt });

            e.HasOne(t => t.User).WithMany()
                .HasForeignKey(t => t.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            e.HasOne(t => t.CreatedBy).WithMany()
                .HasForeignKey(t => t.CreatedById)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Redemption>(e =>
        {
            e.HasOne(r => r.User).WithMany()
                .HasForeignKey(r => r.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            e.HasOne(r => r.Product).WithMany()
                .HasForeignKey(r => r.ProductId)
                .OnDelete(DeleteBehavior.Restrict);

            e.ToTable(t => t.HasCheckConstraint("CK_Redemptions_Quantity", "\"Quantity\" > 0"));
        });

        modelBuilder.Entity<AttendanceEntry>(e =>
        {
            e.Property(a => a.Note).HasMaxLength(250);
            e.HasIndex(a => new { a.UserId, a.Date });

            e.HasOne(a => a.User).WithMany()
                .HasForeignKey(a => a.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            e.HasOne(a => a.CreatedBy).WithMany()
                .HasForeignKey(a => a.CreatedById)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Goal>(e =>
        {
            e.Property(g => g.Period).HasConversion<string>().HasMaxLength(20);
            e.HasIndex(g => g.Period).IsUnique();

            e.HasOne(g => g.UpdatedBy).WithMany()
                .HasForeignKey(g => g.UpdatedById)
                .OnDelete(DeleteBehavior.Restrict);

            e.ToTable(t => t.HasCheckConstraint("CK_Goals_Target", "\"TargetPerEmployee\" > 0"));
        });
    }
}