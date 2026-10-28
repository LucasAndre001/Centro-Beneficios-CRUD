using CentroBeneficios.Api.Dtos.Employees;
using CentroBeneficios.Api.Extensions;
using CentroBeneficios.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CentroBeneficios.Api.Controllers;

[ApiController]
[Route("api/admin/employees")]
[Authorize(Policy = "AdminOnly")]
public class AdminEmployeesController : ControllerBase
{
    private readonly EmployeeService _employees;

    public AdminEmployeesController(EmployeeService employees)
    {
        _employees = employees;
    }

    [HttpGet]
    public async Task<ActionResult<List<EmployeeDto>>> List(
        [FromQuery] string? search,
        [FromQuery] bool includeInactive,
        CancellationToken ct)
    {
        return Ok(await _employees.ListAsync(search, includeInactive, ct));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<EmployeeDto>> Get(int id, CancellationToken ct)
    {
        return Ok(await _employees.GetAsync(id, ct));
    }

    [HttpPost]
    public async Task<ActionResult<EmployeeDto>> Create(CreateEmployeeRequest request, CancellationToken ct)
    {
        var employee = await _employees.CreateAsync(request, User.GetUserId(), ct);
        return CreatedAtAction(nameof(Get), new { id = employee.Id }, employee);
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<EmployeeDto>> Update(int id, UpdateEmployeeRequest request, CancellationToken ct)
    {
        return Ok(await _employees.UpdateAsync(id, request, ct));
    }

    [HttpPatch("{id:int}/status")]
    public async Task<ActionResult<EmployeeDto>> UpdateStatus(int id, UpdateStatusRequest request, CancellationToken ct)
    {
        return Ok(await _employees.SetStatusAsync(id, request.IsActive, ct));
    }

    [HttpPost("{id:int}/point-adjustments")]
    public async Task<ActionResult<EmployeeDto>> AdjustPoints(int id, PointAdjustmentRequest request, CancellationToken ct)
    {
        return Ok(await _employees.AdjustPointsAsync(id, request, User.GetUserId(), ct));
    }

    [HttpGet("{id:int}/attendance-entries")]
    public async Task<ActionResult<AttendanceDayDto>> GetAttendance(
        int id,
        [FromQuery] DateOnly? date,
        CancellationToken ct)
    {
        return Ok(await _employees.GetAttendanceAsync(id, date ?? BrazilClock.Today, ct));
    }

    [HttpPost("{id:int}/attendance-entries")]
    public async Task<ActionResult<AttendanceDayDto>> SetAttendance(
        int id,
        SetAttendanceRequest request,
        CancellationToken ct)
    {
        return Ok(await _employees.SetAttendanceAsync(id, request, User.GetUserId(), ct));
    }
}