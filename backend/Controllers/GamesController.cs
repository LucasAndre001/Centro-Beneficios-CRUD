using CentroBeneficios.Api.Dtos.Games;
using CentroBeneficios.Api.Extensions;
using CentroBeneficios.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CentroBeneficios.Api.Controllers;

[ApiController]
[Route("api/games")]
[Authorize]
public class GamesController : ControllerBase
{
    private readonly GameService _games;

    public GamesController(GameService games)
    {
        _games = games;
    }

    [HttpGet]
    public ActionResult<IReadOnlyList<GameInfoDto>> List()
    {
        return Ok(GameCatalog.Available);
    }

    [HttpGet("{game}/ranking")]
    public async Task<ActionResult<List<GameRankingItemDto>>> Ranking(
        string game,
        [FromQuery] int take = 10,
        CancellationToken ct = default)
    {
        return Ok(await _games.RankingAsync(game, take, ct));
    }

    [HttpGet("{game}/me")]
    [Authorize(Policy = "EmployeeOnly")]
    public async Task<ActionResult<MyGameStatsDto>> Me(string game, CancellationToken ct)
    {
        return Ok(await _games.MyStatsAsync(game, User.GetUserId(), ct));
    }

    [HttpPost("{game}/scores")]
    [Authorize(Policy = "EmployeeOnly")]
    public async Task<ActionResult<GameResultDto>> Submit(
        string game, SubmitScoreRequest request, CancellationToken ct)
    {
        var result = await _games.SubmitAsync(game, User.GetUserId(), request, ct);
        return StatusCode(StatusCodes.Status201Created, result);
    }
}
