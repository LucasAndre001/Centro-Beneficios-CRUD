namespace CentroBeneficios.Api.Entities;

public class AttendanceEntry
{
    public int Id { get; set; }

    public int UserId { get; set; }
    public User User { get; set; } = null!;

    public DateOnly Date { get; set; }

    public int Delta { get; set; }

    public string? Note { get; set; }

    public int CreatedById { get; set; }
    public User CreatedBy { get; set; } = null!;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}