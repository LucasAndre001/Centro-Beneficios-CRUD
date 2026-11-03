using CentroBeneficios.Api.Dtos.Redemptions;
using CentroBeneficios.Api.Extensions;
using CentroBeneficios.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CentroBeneficios.Api.Controllers;

[ApiController]
[Route("api/redemptions")]
[Authorize(Policy = "EmployeeOnly")]
public class RedemptionsController : ControllerBase
{
    private readonly RedemptionService _redemptions;

    public RedemptionsController(RedemptionService redemptions)
    {
        _redemptions = redemptions;
    }

    [HttpPost]
    public async Task<ActionResult<RedeemResultDto>> Redeem(RedeemRequest request, CancellationToken ct)
    {
        var result = await _redemptions.RedeemAsync(User.GetUserId(), request, ct);
        return StatusCode(StatusCodes.Status201Created, result);
    }
}