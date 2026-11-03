using CentroBeneficios.Api.Data;
using Microsoft.AspNetCore.Mvc;

namespace CentroBeneficios.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class HealthController : ControllerBase
{
    private readonly AppDbContext _db;

    public HealthController(AppDbContext db)
    {
        _db = db;
    }

    // GET /api/health
    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken ct)
    {
        var conectou = await _db.Database.CanConnectAsync(ct);

        if (!conectou)
        {
            return StatusCode(503, new { status = "erro", database = "sem conexão" });
        }

        return Ok(new { status = "ok", database = "conectado" });
    }
}