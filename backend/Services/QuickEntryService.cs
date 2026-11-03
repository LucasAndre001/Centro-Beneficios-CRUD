using CentroBeneficios.Api.Data;
using CentroBeneficios.Api.Dtos.QuickEntry;
using CentroBeneficios.Api.Entities;
using CentroBeneficios.Api.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace CentroBeneficios.Api.Services;

public class QuickEntryService
{
    private readonly AppDbContext _db;

    public QuickEntryService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<List<AttendanceRowDto>> ListAttendanceAsync(DateOnly date, CancellationToken ct)
    {
        var totals = await TotalsForDayAsync(date, null, ct);

        var employees = await ActiveEmployees()
            .OrderBy(u => u.Name)
            .Select(u => new { u.Id, u.Name })
            .ToListAsync(ct);

        return employees
            .Select(e => new AttendanceRowDto(e.Id, e.Name, totals.GetValueOrDefault(e.Id)))
            .ToList();
    }

    public async Task<BatchResultDto> SaveAttendanceAsync(
        AttendanceBatchRequest request, int adminId, CancellationToken ct)
    {
        if (request.Date > BrazilClock.Today)
        {
            throw new AppException("Não é possível lançar atendimentos em data futura.");
        }

        var ids = request.Items.Select(i => i.EmployeeId).ToList();
        await EnsureActiveEmployeesAsync(ids, ct);

        var totals = await TotalsForDayAsync(request.Date, ids, ct);
        var note = string.IsNullOrWhiteSpace(request.Note) ? null : request.Note.Trim();
        var changed = 0;

        foreach (var item in request.Items)
        {
            var delta = item.Quantity - totals.GetValueOrDefault(item.EmployeeId);

            if (delta == 0)
            {
                continue;
            }

            _db.AttendanceEntries.Add(new AttendanceEntry
            {
                UserId = item.EmployeeId,
                Date = request.Date,
                Delta = delta,
                Note = note,
                CreatedById = adminId
            });
            changed++;
        }

        if (changed > 0)
        {
            await _db.SaveChangesAsync(ct);
        }

        return new BatchResultDto(changed);
    }

    public async Task<BatchResultDto> AdjustPointsAsync(
        PointsBatchRequest request, int adminId, CancellationToken ct)
    {
        if (request.Amount == 0)
        {
            throw new AppException("O ajuste não pode ser zero.");
        }

        var reason = request.Reason.Trim();
        if (reason.Length == 0)
        {
            throw new AppException("Informe o motivo do ajuste.");
        }

        var ids = request.EmployeeIds;
        var names = await EnsureActiveEmployeesAsync(ids, ct);

        await using var transaction = await _db.Database.BeginTransactionAsync(ct);

        foreach (var id in ids)
        {
            // UPDATE condicional: o saldo nunca fica negativo, mesmo com um resgate acontecendo ao mesmo tempo
            var updated = await _db.Users
                .Where(u => u.Id == id && u.PointsBalance + request.Amount >= 0)
                .ExecuteUpdateAsync(s => s.SetProperty(u => u.PointsBalance, u => u.PointsBalance + request.Amount), ct);

            if (updated == 0)
            {
                throw new AppException(
                    $"O saldo de {names[id]} ficaria negativo.", StatusCodes.Status409Conflict);
            }

            _db.PointTransactions.Add(new PointTransaction
            {
                UserId = id,
                Amount = request.Amount,
                Type = PointTransactionType.AdminAdjustment,
                Description = $"Ajuste: {reason}",
                CreatedById = adminId
            });
        }

        await _db.SaveChangesAsync(ct);
        await transaction.CommitAsync(ct);

        return new BatchResultDto(ids.Count);
    }

    private IQueryable<User> ActiveEmployees() =>
        _db.Users.AsNoTracking().Where(u => u.Role == UserRole.Employee && u.IsActive);

    private async Task<Dictionary<int, string>> EnsureActiveEmployeesAsync(List<int> ids, CancellationToken ct)
    {
        if (ids.Distinct().Count() != ids.Count)
        {
            throw new AppException("O mesmo funcionário foi enviado mais de uma vez.");
        }

        var found = await ActiveEmployees()
            .Where(u => ids.Contains(u.Id))
            .ToDictionaryAsync(u => u.Id, u => u.Name, ct);

        if (found.Count != ids.Count)
        {
            throw new AppException("Funcionário não encontrado ou inativo.", StatusCodes.Status404NotFound);
        }

        return found;
    }

    private async Task<Dictionary<int, int>> TotalsForDayAsync(
        DateOnly date, List<int>? userIds, CancellationToken ct)
    {
        var query = _db.AttendanceEntries.AsNoTracking().Where(a => a.Date == date);

        if (userIds is not null)
        {
            query = query.Where(a => userIds.Contains(a.UserId));
        }

        return await query
            .GroupBy(a => a.UserId)
            .Select(g => new { UserId = g.Key, Total = g.Sum(a => a.Delta) })
            .ToDictionaryAsync(x => x.UserId, x => x.Total, ct);
    }
}
