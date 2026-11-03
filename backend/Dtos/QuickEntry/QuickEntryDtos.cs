using System.ComponentModel.DataAnnotations;

namespace CentroBeneficios.Api.Dtos.QuickEntry;

public record AttendanceRowDto(int EmployeeId, string Name, int Total);

public class AttendanceBatchItem
{
    [Range(1, int.MaxValue)]
    public int EmployeeId { get; set; }

    [Range(0, 100_000)]
    public int Quantity { get; set; }
}

public class AttendanceBatchRequest
{
    public DateOnly Date { get; set; }

    [MaxLength(250)]
    public string? Note { get; set; }

    [Required, MinLength(1)]
    public List<AttendanceBatchItem> Items { get; set; } = [];
}

public class PointsBatchRequest
{
    [Range(-1_000_000, 1_000_000)]
    public int Amount { get; set; }

    [Required, MaxLength(200)]
    public string Reason { get; set; } = string.Empty;

    [Required, MinLength(1)]
    public List<int> EmployeeIds { get; set; } = [];
}

public record BatchResultDto(int Changed);
