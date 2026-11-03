using CentroBeneficios.Api.Data;
using CentroBeneficios.Api.Dtos.Goals;
using CentroBeneficios.Api.Entities;
using Microsoft.EntityFrameworkCore;

namespace CentroBeneficios.Api.Services;

public class GoalService
{
    private readonly AppDbContext _db;

    public GoalService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<GoalsDto> GetAsync(CancellationToken ct)
    {
        var goals = await _db.Goals.AsNoTracking()
            .ToDictionaryAsync(g => g.Period, g => g.TargetPerEmployee, ct);

        return ToDto(goals);
    }

    // Período enviado como null remove a meta; todos null removem todas as metas.
    public async Task<GoalsDto> UpdateAsync(UpdateGoalsRequest request, int adminId, CancellationToken ct)
    {
        var existing = await _db.Goals.ToListAsync(ct);

        Upsert(existing, GoalPeriod.Day, request.Day, adminId);
        Upsert(existing, GoalPeriod.Week, request.Week, adminId);
        Upsert(existing, GoalPeriod.Month, request.Month, adminId);

        await _db.SaveChangesAsync(ct);
        return await GetAsync(ct);
    }

    private void Upsert(List<Goal> existing, GoalPeriod period, int? target, int adminId)
    {
        var goal = existing.FirstOrDefault(g => g.Period == period);

        if (target is null)
        {
            if (goal is not null)
            {
                _db.Goals.Remove(goal);
            }

            return;
        }

        if (goal is null)
        {
            _db.Goals.Add(new Goal
            {
                Period = period,
                TargetPerEmployee = target.Value,
                UpdatedById = adminId
            });
            return;
        }

        goal.TargetPerEmployee = target.Value;
        goal.UpdatedById = adminId;
        goal.UpdatedAt = DateTime.UtcNow;
    }

    private static GoalsDto ToDto(Dictionary<GoalPeriod, int> goals) =>
        new(Get(goals, GoalPeriod.Day), Get(goals, GoalPeriod.Week), Get(goals, GoalPeriod.Month));

    private static int? Get(Dictionary<GoalPeriod, int> goals, GoalPeriod period) =>
        goals.TryGetValue(period, out var target) ? target : null;
}