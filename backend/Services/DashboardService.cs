using CentroBeneficios.Api.Data;
using CentroBeneficios.Api.Dtos.Dashboard;
using CentroBeneficios.Api.Entities;
using CentroBeneficios.Api.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace CentroBeneficios.Api.Services;

public class DashboardService
{
    private readonly AppDbContext _db;
    private readonly MeService _me;

    public DashboardService(AppDbContext db, MeService me)
    {
        _db = db;
        _me = me;
    }

    public async Task<EmployeeDashboardDto> GetEmployeeDashboardAsync(int userId, CancellationToken ct)
    {
        var user = await _db.Users.AsNoTracking()
            .Where(u => u.Id == userId)
            .Select(u => new { u.Name, u.PointsBalance })
            .FirstOrDefaultAsync(ct)
            ?? throw new AppException("Usuário não encontrado.", StatusCodes.Status404NotFound);

        var targets = await _db.Goals.AsNoTracking()
            .ToDictionaryAsync(g => g.Period, g => g.TargetPerEmployee, ct);

        var goals = new List<GoalProgressDto>();

        foreach (var period in Enum.GetValues<GoalPeriod>())
        {
            var (start, end) = BrazilClock.GetRange(period);

            var total = await _db.AttendanceEntries
                .Where(a => a.UserId == userId && a.Date >= start && a.Date <= end)
                .SumAsync(a => a.Delta, ct);

            int? target = targets.TryGetValue(period, out var t) ? t : null;

            goals.Add(new GoalProgressDto(period, start, end, total, target, Percent(total, target)));
        }

        var transactions = await _me.ListTransactionsAsync(userId, 20, ct);
        var redemptions = await _me.ListRedemptionsAsync(userId, 10, ct);

        return new EmployeeDashboardDto(user.Name, user.PointsBalance, goals, transactions, redemptions);
    }

    public async Task<AdminDashboardDto> GetAdminDashboardAsync(GoalPeriod period, CancellationToken ct)
    {
        var (start, end) = BrazilClock.GetRange(period);

        var employees = await _db.Users.AsNoTracking()
            .Where(u => u.Role == UserRole.Employee && u.IsActive)
            .Select(u => new { u.Id, u.Name, u.PointsBalance })
            .ToListAsync(ct);

        var totals = await _db.AttendanceEntries.AsNoTracking()
            .Where(a => a.Date >= start && a.Date <= end)
            .GroupBy(a => a.UserId)
            .Select(g => new { UserId = g.Key, Total = g.Sum(a => a.Delta) })
            .ToDictionaryAsync(x => x.UserId, x => x.Total, ct);

        var target = await _db.Goals.AsNoTracking()
            .Where(g => g.Period == period)
            .Select(g => (int?)g.TargetPerEmployee)
            .FirstOrDefaultAsync(ct);

        var byName = StringComparer.InvariantCultureIgnoreCase;

        var attendanceRanking = employees
            .Select(e => new { e.Id, e.Name, Total = totals.GetValueOrDefault(e.Id) })
            .OrderByDescending(x => x.Total)
            .ThenBy(x => x.Name, byName)
            .Select((x, i) => new AttendanceRankingItemDto(i + 1, x.Id, x.Name, x.Total, Percent(x.Total, target)))
            .ToList();

        // Ranking de valores provisório: saldo atual de pontos (decisão D-05)
        var valueRanking = employees
            .OrderByDescending(e => e.PointsBalance)
            .ThenBy(e => e.Name, byName)
            .Select((e, i) => new ValueRankingItemDto(i + 1, e.Id, e.Name, e.PointsBalance))
            .ToList();

        return new AdminDashboardDto(period, start, end, target, attendanceRanking, valueRanking);
    }

    private static int? Percent(int total, int? target) =>
        target is > 0
            ? (int)Math.Round(total * 100.0 / target.Value, MidpointRounding.AwayFromZero)
            : null;
}