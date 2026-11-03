using CentroBeneficios.Api.Dtos.Goals;
using CentroBeneficios.Api.Extensions;
using CentroBeneficios.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CentroBeneficios.Api.Controllers;

[ApiController]
[Route("api/admin/goals")]
[Authorize(Policy = "AdminOnly")]
public class AdminGoalsController : ControllerBase
{
    private readonly GoalService _goals;

    public AdminGoalsController(GoalService goals)
    {
        _goals = goals;
    }

    [HttpGet]
    public async Task<ActionResult<GoalsDto>> Get(CancellationToken ct)
    {
        return Ok(await _goals.GetAsync(ct));
    }

    [HttpPut]
    public async Task<ActionResult<GoalsDto>> Update(UpdateGoalsRequest request, CancellationToken ct)
    {
        return Ok(await _goals.UpdateAsync(request, User.GetUserId(), ct));
    }
}