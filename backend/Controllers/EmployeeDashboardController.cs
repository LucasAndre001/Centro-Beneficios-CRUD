using CentroBeneficios.Api.Dtos.Dashboard;
using CentroBeneficios.Api.Extensions;
using CentroBeneficios.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CentroBeneficios.Api.Controllers;

[ApiController]
[Route("api/me/dashboard")]
[Authorize(Policy = "EmployeeOnly")]
public class EmployeeDashboardController : ControllerBase
{
    private readonly DashboardService _dashboard;

    public EmployeeDashboardController(DashboardService dashboard)
    {
        _dashboard = dashboard;
    }

    [HttpGet]
    public async Task<ActionResult<EmployeeDashboardDto>> Get(CancellationToken ct)
    {
        return Ok(await _dashboard.GetEmployeeDashboardAsync(User.GetUserId(), ct));
    }
}