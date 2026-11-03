using CentroBeneficios.Api.Dtos.Me;
using CentroBeneficios.Api.Dtos.Redemptions;
using CentroBeneficios.Api.Entities;

namespace CentroBeneficios.Api.Dtos.Dashboard;

public record GoalProgressDto(
    GoalPeriod Period,
    DateOnly Start,
    DateOnly End,
    int Total,
    int? Target,
    int? Percent);

public record EmployeeDashboardDto(
    string Name,
    int PointsBalance,
    List<GoalProgressDto> Goals,
    List<PointTransactionDto> RecentTransactions,
    List<RedemptionDto> RecentRedemptions);

public record AttendanceRankingItemDto(
    int Position,
    int EmployeeId,
    string Name,
    int Total,
    int? Percent);

public record ValueRankingItemDto(
    int Position,
    int EmployeeId,
    string Name,
    int PointsBalance);

public record AdminDashboardDto(
    GoalPeriod Period,
    DateOnly Start,
    DateOnly End,
    int? Target,
    List<AttendanceRankingItemDto> AttendanceRanking,
    List<ValueRankingItemDto> ValueRanking);