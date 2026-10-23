using Microsoft.EntityFrameworkCore;

namespace CentroBeneficios.Api.Data;

///<summary>
/// Representa a "conversa" da API com o banco de dados
/// Cada tabela será exposta aqui como um DbSet
/// </summary>
public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }
}