using CentroBeneficios.Api.Dtos.Me;
using CentroBeneficios.Api.Dtos.Redemptions;
using CentroBeneficios.Api.Extensions;
using CentroBeneficios.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CentroBeneficios.Api.Controllers;

[ApiController]
[Route("api/me")]
[Authorize(Policy = "EmployeeOnly")]
public class MeController : ControllerBase
{
    private readonly MeService _me;

    public MeController(MeService me)
    {
        _me = me;
    }

    [HttpGet("balance")]
    public async Task<ActionResult<BalanceDto>> Balance(CancellationToken ct)
    {
        return Ok(await _me.GetBalanceAsync(User.GetUserId(), ct));
    }

    [HttpGet("point-transactions")]
    public async Task<ActionResult<List<PointTransactionDto>>> Transactions(
        [FromQuery] int take = 50,
        CancellationToken ct = default)
    {
        return Ok(await _me.ListTransactionsAsync(User.GetUserId(), take, ct));
    }

    [HttpGet("redemptions")]
    public async Task<ActionResult<List<RedemptionDto>>> Redemptions(
        [FromQuery] int take = 20,
        CancellationToken ct = default)
    {
        return Ok(await _me.ListRedemptionsAsync(User.GetUserId(), take, ct));
    }
}