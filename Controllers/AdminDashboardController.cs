using CentroBeneficios.Api.Dtos.Dashboard;
using CentroBeneficios.Api.Entities;
using CentroBeneficios.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CentroBeneficios.Api.Controllers;

[ApiController]
[Route("api/admin/dashboard")]
[Authorize(Policy = "AdminOnly")]
public class AdminDashboardController : ControllerBase
{
    private readonly DashboardService _dashboard;

    public AdminDashboardController(DashboardService dashboard)
    {
        _dashboard = dashboard;
    }

    [HttpGet]
    public async Task<ActionResult<AdminDashboardDto>> Get(
        [FromQuery] GoalPeriod period = GoalPeriod.Month,
        CancellationToken ct = default)
    {
        return Ok(await _dashboard.GetAdminDashboardAsync(period, ct));
    }
}