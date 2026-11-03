using CentroBeneficios.Api.Entities;

namespace CentroBeneficios.Api.Services;

public static class BrazilClock
{
    private static readonly TimeZoneInfo Zone = LoadZone();

    public static DateOnly Today =>
        DateOnly.FromDateTime(TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, Zone));

    public static DateTime StartOfDayUtc(DateOnly date) =>
        TimeZoneInfo.ConvertTimeToUtc(date.ToDateTime(TimeOnly.MinValue), Zone);

    public static (DateOnly Start, DateOnly End) GetRange(GoalPeriod period)
    {
        var today = Today;

        if (period == GoalPeriod.Day)
        {
            return (today, today);
        }

        if (period == GoalPeriod.Week)
        {
            // Semana de segunda a domingo
            var daysSinceMonday = ((int)today.DayOfWeek + 6) % 7;
            var monday = today.AddDays(-daysSinceMonday);
            return (monday, monday.AddDays(6));
        }

        if (period == GoalPeriod.Month)
        {
            var first = new DateOnly(today.Year, today.Month, 1);
            return (first, first.AddMonths(1).AddDays(-1));
        }

        throw new ArgumentOutOfRangeException(nameof(period));
    }

    private static TimeZoneInfo LoadZone()
    {
        try
        {
            return TimeZoneInfo.FindSystemTimeZoneById("America/Sao_Paulo");
        }
        catch (TimeZoneNotFoundException)
        {
            return TimeZoneInfo.CreateCustomTimeZone("BRT", TimeSpan.FromHours(-3), "Brasília", "Brasília");
        }
    }
}