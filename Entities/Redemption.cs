namespace CentroBeneficios.Api.Entities;

public class Redemption
{
    public int Id { get; set; }

    public int UserId { get; set; }
    public User User { get; set; } = null!;

    public int ProductId { get; set; }
    public Product Product { get; set; } = null!;

    public int Quantity { get; set; } = 1;

    public int UnitCostSnapshot { get; set; }
    public int TotalCostPoints { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}