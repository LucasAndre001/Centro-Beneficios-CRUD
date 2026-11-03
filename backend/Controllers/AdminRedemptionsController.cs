using CentroBeneficios.Api.Dtos.Redemptions;
using CentroBeneficios.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CentroBeneficios.Api.Controllers;

[ApiController]
[Route("api/admin/redemptions")]
[Authorize(Policy = "AdminOnly")]
public class AdminRedemptionsController : ControllerBase
{
    private readonly RedemptionService _redemptions;

    public AdminRedemptionsController(RedemptionService redemptions)
    {
        _redemptions = redemptions;
    }

    [HttpGet]
    public async Task<ActionResult<List<AdminRedemptionDto>>> List(
        [FromQuery] string? search,
        [FromQuery] DateOnly? from,
        [FromQuery] int take = 200,
        CancellationToken ct = default)
    {
        return Ok(await _redemptions.ListAllAsync(search, from, take, ct));
    }
}
