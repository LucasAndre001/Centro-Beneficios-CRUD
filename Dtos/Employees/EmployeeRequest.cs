using System.ComponentModel.DataAnnotations;

namespace CentroBeneficios.Api.Dtos.Employees;

public class CreateEmployeeRequest
{
    [Required, MaxLength(120)]
    public string Name { get; set; } = string.Empty;

    [Required, EmailAddress, MaxLength(254)]
    public string Email { get; set; } = string.Empty;

    [Required, MinLength(6)]
    public string Password { get; set; } = string.Empty;

    [Range(0, 1_000_000)]
    public int InitialPoints { get; set; }
}

public class UpdateEmployeeRequest
{
    [Required, MaxLength(120)]
    public string Name { get; set; } = string.Empty;

    [Required, EmailAddress, MaxLength(254)]
    public string Email { get; set; } = string.Empty;

    public string? Password { get; set; }
}

public class UpdateStatusRequest
{
    public bool IsActive { get; set; }
}

public class PointAdjustmentRequest
{
    [Range(-1_000_000, 1_000_000)]
    public int Amount { get; set; }

    [Required, MaxLength(200)]
    public string Reason { get; set; } = string.Empty;
}

public class SetAttendanceRequest
{
    public DateOnly Date { get; set; }

    [Range(0, 100_000)]
    public int Quantity { get; set; }

    [MaxLength(250)]
    public string? Note { get; set; }
}