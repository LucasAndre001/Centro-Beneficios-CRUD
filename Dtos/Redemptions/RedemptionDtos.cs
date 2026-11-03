using System.ComponentModel.DataAnnotations;

namespace CentroBeneficios.Api.Dtos.Redemptions;

public class RedeemRequest
{
    [Range(1, int.MaxValue)]
    public int ProductId { get; set; }

    [Range(1, 10)]
    public int Quantity { get; set; } = 1;
}

public record RedemptionDto(
    int Id,
    int ProductId,
    string ProductName,
    int Quantity,
    int UnitCost,
    int TotalCostPoints,
    DateTime CreatedAt);

public record RedeemResultDto(RedemptionDto Redemption, int NewBalance);