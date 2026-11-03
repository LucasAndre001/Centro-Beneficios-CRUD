namespace CentroBeneficios.Api.Entities;

public class Goal
{
    public int Id { get; set; }
    public GoalPeriod Period { get; set; }
    public int TargetPerEmployee { get; set; }

    public int UpdatedById { get; set; }
    public User UpdatedBy { get; set; } = null!;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}