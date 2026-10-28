using CentroBeneficios.Api.Data;
using CentroBeneficios.Api.Dtos.Auth;
using CentroBeneficios.Api.Extensions;
using CentroBeneficios.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CentroBeneficios.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly TokenService _tokens;

    public AuthController(AppDbContext db, TokenService tokens)
    {
        _db = db;
        _tokens = tokens;
    }

    [HttpPost("login")]
    public async Task<ActionResult<LoginResponse>> Login(LoginRequest request, CancellationToken ct)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == email, ct);

        if (user is null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
        {
            return Unauthorized(new { message = "E-mail ou senha inválidos." });
        }

        if (!user.IsActive)
        {
            return Unauthorized(new { message = "Usuário inativo. Fale com a supervisão." });
        }

        var (token, expiresAt) = _tokens.CreateToken(user);
        var info = new UserInfo(user.Id, user.Name, user.Email, user.Role.ToString());

        return Ok(new LoginResponse(token, expiresAt, info));
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<UserInfo>> Me(CancellationToken ct)
    {
        var userId = User.GetUserId();
        var user = await _db.Users.AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == userId && u.IsActive, ct);

        if (user is null)
        {
            return Unauthorized();
        }

        return Ok(new UserInfo(user.Id, user.Name, user.Email, user.Role.ToString()));
    }
}