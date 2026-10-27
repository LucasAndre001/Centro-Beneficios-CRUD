namespace CentroBeneficios.Api.Entities;

public class PointTransaction
{
    public int Id { get; set; }

    public int UserId { get; set; }
    public User User { get; set; } = null!;

    // Positivo = crédito, negativo = débito
    public int Amount { get; set; }

    public PointTransactionType Type { get; set; }
    public string Description { get; set; } = string.Empty;

    // Id do registro de origem (ex.: o resgate que gerou o débito)
    public int? ReferenceId { get; set; }

    public int? CreatedById { get; set; }
    public User? CreatedBy { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}