using CentroBeneficios.Api.Data;
using CentroBeneficios.Api.Dtos.Redemptions;
using CentroBeneficios.Api.Entities;
using CentroBeneficios.Api.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace CentroBeneficios.Api.Services;

public class RedemptionService
{
    private readonly AppDbContext _db;

    public RedemptionService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<RedeemResultDto> RedeemAsync(int userId, RedeemRequest request, CancellationToken ct)
    {
        var user = await _db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId, ct);

        if (user is null || !user.IsActive || user.Role != UserRole.Employee)
        {
            throw new AppException("Usuário sem permissão para resgatar.", StatusCodes.Status403Forbidden);
        }

        var product = await _db.Products.AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == request.ProductId && p.Status == ProductStatus.Published, ct);

        if (product is null)
        {
            throw new AppException("Produto indisponível.", StatusCodes.Status404NotFound);
        }

        var quantity = request.Quantity;
        var unitCost = product.PointCost;
        var total = unitCost * quantity;

        // Verificações antecipadas: só servem para dar a mensagem certa na maioria dos casos.
        // A proteção real contra concorrência são os UPDATEs condicionais abaixo.
        if (product.StockQuantity < quantity)
        {
            throw new AppException("Estoque esgotado.", StatusCodes.Status409Conflict);
        }

        if (user.PointsBalance < total)
        {
            throw new AppException("Saldo insuficiente.", StatusCodes.Status409Conflict);
        }

        await using var transaction = await _db.Database.BeginTransactionAsync(ct);

        // Baixa o estoque somente se ainda houver quantidade e o custo continuar o mesmo.
        var stockUpdated = await _db.Products
            .Where(p => p.Id == product.Id
                        && p.Status == ProductStatus.Published
                        && p.PointCost == unitCost
                        && p.StockQuantity >= quantity)
            .ExecuteUpdateAsync(s => s.SetProperty(p => p.StockQuantity, p => p.StockQuantity - quantity), ct);

        if (stockUpdated == 0)
        {
            throw new AppException(await DescribeStockFailureAsync(product.Id, quantity, ct),
                StatusCodes.Status409Conflict);
        }

        // Debita os pontos somente se o saldo ainda cobrir o total.
        var balanceUpdated = await _db.Users
            .Where(u => u.Id == userId && u.IsActive && u.PointsBalance >= total)
            .ExecuteUpdateAsync(s => s.SetProperty(u => u.PointsBalance, u => u.PointsBalance - total), ct);

        if (balanceUpdated == 0)
        {
            throw new AppException("Saldo insuficiente.", StatusCodes.Status409Conflict);
        }

        var redemption = new Redemption
        {
            UserId = userId,
            ProductId = product.Id,
            Quantity = quantity,
            UnitCostSnapshot = unitCost,
            TotalCostPoints = total
        };
        _db.Redemptions.Add(redemption);
        await _db.SaveChangesAsync(ct);

        _db.PointTransactions.Add(new PointTransaction
        {
            UserId = userId,
            Amount = -total,
            Type = PointTransactionType.Redemption,
            Description = quantity > 1 ? $"Resgate: {quantity}x {product.Name}" : $"Resgate: {product.Name}",
            ReferenceId = redemption.Id
        });
        await _db.SaveChangesAsync(ct);

        await transaction.CommitAsync(ct);

        var newBalance = await _db.Users.AsNoTracking()
            .Where(u => u.Id == userId)
            .Select(u => u.PointsBalance)
            .SingleAsync(ct);

        var dto = new RedemptionDto(
            redemption.Id, product.Id, product.Name, quantity, unitCost, total, redemption.CreatedAt);

        return new RedeemResultDto(dto, newBalance);
    }

    public async Task<List<AdminRedemptionDto>> ListAllAsync(
        string? search, DateOnly? from, int take, CancellationToken ct)
    {
        var query = _db.Redemptions.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var pattern = $"%{search.Trim()}%";
            query = query.Where(r =>
                EF.Functions.ILike(r.User.Name, pattern) || EF.Functions.ILike(r.Product.Name, pattern));
        }

        if (from is not null)
        {
            var fromUtc = BrazilClock.StartOfDayUtc(from.Value);
            query = query.Where(r => r.CreatedAt >= fromUtc);
        }

        return await query
            .OrderByDescending(r => r.CreatedAt)
            .ThenByDescending(r => r.Id)
            .Take(Math.Clamp(take, 1, 500))
            .Select(r => new AdminRedemptionDto(
                r.Id, r.UserId, r.User.Name, r.ProductId, r.Product.Name,
                r.Quantity, r.UnitCostSnapshot, r.TotalCostPoints, r.CreatedAt))
            .ToListAsync(ct);
    }

    private async Task<string> DescribeStockFailureAsync(int productId, int quantity, CancellationToken ct)
    {
        var current = await _db.Products.AsNoTracking().FirstOrDefaultAsync(p => p.Id == productId, ct);

        if (current is null || current.Status != ProductStatus.Published)
        {
            return "Produto indisponível.";
        }

        return current.StockQuantity < quantity
            ? "Estoque esgotado."
            : "O custo do produto mudou. Atualize a loja e tente novamente.";
    }
}