using CentroBeneficios.Api.Entities;
using Microsoft.EntityFrameworkCore;

namespace CentroBeneficios.Api.Data;

public static class DbSeeder
{
    public static async Task SeedAdminAsync(IServiceProvider services, IConfiguration config)
    {
        using var scope = services.CreateScope();
        var logger = scope.ServiceProvider.GetRequiredService<ILoggerFactory>().CreateLogger("DbSeeder");

        try
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            if (await db.Users.AnyAsync(u => u.Role == UserRole.Admin))
            {
                return;
            }

            var email = config["Seed:AdminEmail"];
            var password = config["Seed:AdminPassword"];

            if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(password))
            {
                logger.LogWarning("Nenhum administrador existe e Seed:AdminEmail/Seed:AdminPassword não estão configurados.");
                return;
            }

            db.Users.Add(new User
            {
                Name = config["Seed:AdminName"] ?? "Administrador",
                Email = email.Trim().ToLowerInvariant(),
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(password),
                Role = UserRole.Admin
            });

            await db.SaveChangesAsync();
            logger.LogInformation("Administrador inicial criado: {Email}", email);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Não foi possível criar o administrador inicial.");
        }
    }
}