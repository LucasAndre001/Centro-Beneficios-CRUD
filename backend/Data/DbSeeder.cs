using CentroBeneficios.Api.Entities;
using Microsoft.EntityFrameworkCore;

namespace CentroBeneficios.Api.Data;

public static class DbSeeder
{
    private record AdminSeed(string Name, string Email, string Password);

    // Cria cada administrador configurado cujo e-mail ainda não existe. Nunca altera contas existentes.
    public static async Task SeedAdminAsync(IServiceProvider services, IConfiguration config)
    {
        using var scope = services.CreateScope();
        var logger = scope.ServiceProvider.GetRequiredService<ILoggerFactory>().CreateLogger("DbSeeder");

        try
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            foreach (var seed in ReadSeeds(config))
            {
                var email = seed.Email.Trim().ToLowerInvariant();

                if (await db.Users.AnyAsync(u => u.Email == email))
                {
                    continue;
                }

                db.Users.Add(new User
                {
                    Name = seed.Name.Trim(),
                    Email = email,
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword(seed.Password),
                    Role = UserRole.Admin
                });

                await db.SaveChangesAsync();
                logger.LogInformation("Administrador criado: {Email}", email);
            }
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Não foi possível criar os administradores.");
        }
    }

    // Aceita o formato antigo (Seed:AdminEmail) e a lista Seed:Admins:0, Seed:Admins:1...
    private static List<AdminSeed> ReadSeeds(IConfiguration config)
    {
        var seeds = config.GetSection("Seed:Admins")
            .GetChildren()
            .Select(s => new AdminSeed(s["Name"] ?? "Administrador", s["Email"] ?? "", s["Password"] ?? ""))
            .ToList();

        seeds.Add(new AdminSeed(
            config["Seed:AdminName"] ?? "Administrador",
            config["Seed:AdminEmail"] ?? "",
            config["Seed:AdminPassword"] ?? ""));

        return seeds
            .Where(s => !string.IsNullOrWhiteSpace(s.Email) && !string.IsNullOrWhiteSpace(s.Password))
            .ToList();
    }
}
