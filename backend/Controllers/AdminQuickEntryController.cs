using CentroBeneficios.Api.Dtos.QuickEntry;
using CentroBeneficios.Api.Extensions;
using CentroBeneficios.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CentroBeneficios.Api.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize(Policy = "AdminOnly")]
public class AdminQuickEntryController : ControllerBase
{
    private readonly QuickEntryService _quickEntry;

    public AdminQuickEntryController(QuickEntryService quickEntry)
    {
        _quickEntry = quickEntry;
    }

    [HttpGet("attendance")]
    public async Task<ActionResult<List<AttendanceRowDto>>> ListAttendance(
        [FromQuery] DateOnly? date,
        CancellationToken ct)
    {
        return Ok(await _quickEntry.ListAttendanceAsync(date ?? BrazilClock.Today, ct));
    }

    [HttpPost("attendance/batch")]
    public async Task<ActionResult<BatchResultDto>> SaveAttendance(
        AttendanceBatchRequest request,
        CancellationToken ct)
    {
        return Ok(await _quickEntry.SaveAttendanceAsync(request, User.GetUserId(), ct));
    }

    [HttpPost("point-adjustments/batch")]
    public async Task<ActionResult<BatchResultDto>> AdjustPoints(
        PointsBatchRequest request,
        CancellationToken ct)
    {
        return Ok(await _quickEntry.AdjustPointsAsync(request, User.GetUserId(), ct));
    }
}
