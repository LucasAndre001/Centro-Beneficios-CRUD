using CentroBeneficios.Api.Entities;

namespace CentroBeneficios.Api.Dtos.Me;

public record BalanceDto(int PointsBalance);

public record PointTransactionDto(
    int Id,
    int Amount,
    PointTransactionType Type,
    string Description,
    DateTime CreatedAt);