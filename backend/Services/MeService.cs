using CentroBeneficios.Api.Data;
using CentroBeneficios.Api.Dtos.Me;
using CentroBeneficios.Api.Dtos.Redemptions;
using CentroBeneficios.Api.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace CentroBeneficios.Api.Services;

public class MeService
{
    private readonly AppDbContext _db;

    public MeService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<BalanceDto> GetBalanceAsync(int userId, CancellationToken ct)
    {
        var balance = await _db.Users.AsNoTracking()
            .Where(u => u.Id == userId)
            .Select(u => (int?)u.PointsBalance)
            .FirstOrDefaultAsync(ct);

        if (balance is null)
        {
            throw new AppException("Usuário não encontrado.", StatusCodes.Status404NotFound);
        }

        return new BalanceDto(balance.Value);
    }

    public async Task<List<PointTransactionDto>> ListTransactionsAsync(int userId, int take, CancellationToken ct)
    {
        return await _db.PointTransactions.AsNoTracking()
            .Where(t => t.UserId == userId)
            .OrderByDescending(t => t.CreatedAt)
            .ThenByDescending(t => t.Id)
            .Take(Math.Clamp(take, 1, 200))
            .Select(t => new PointTransactionDto(t.Id, t.Amount, t.Type, t.Description, t.CreatedAt))
            .ToListAsync(ct);
    }

    public async Task<List<RedemptionDto>> ListRedemptionsAsync(int userId, int take, CancellationToken ct)
    {
        return await _db.Redemptions.AsNoTracking()
            .Where(r => r.UserId == userId)
            .OrderByDescending(r => r.CreatedAt)
            .ThenByDescending(r => r.Id)
            .Take(Math.Clamp(take, 1, 200))
            .Select(r => new RedemptionDto(
                r.Id, r.ProductId, r.Product.Name, r.Quantity,
                r.UnitCostSnapshot, r.TotalCostPoints, r.CreatedAt))
            .ToListAsync(ct);
    }
}