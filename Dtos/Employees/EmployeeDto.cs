namespace CentroBeneficios.Api.Dtos.Employees;

public record EmployeeDto(
    int Id,
    string Name,
    string Email,
    bool IsActive,
    int PointsBalance,
    DateTime CreatedAt);

public record AttendanceDayDto(DateOnly Date, int Total);