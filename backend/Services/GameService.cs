using CentroBeneficios.Api.Data;
using CentroBeneficios.Api.Dtos.Games;
using CentroBeneficios.Api.Entities;
using CentroBeneficios.Api.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace CentroBeneficios.Api.Services;

public class GameService
{
    private readonly AppDbContext _db;

    public GameService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<GameResultDto> SubmitAsync(
        string game, int userId, SubmitScoreRequest request, CancellationToken ct)
    {
        EnsureGame(game);
        ValidateTetrisScore(request);

        var isActiveEmployee = await _db.Users
            .AnyAsync(u => u.Id == userId && u.IsActive && u.Role == UserRole.Employee, ct);

        if (!isActiveEmployee)
        {
            throw new AppException("Usuário sem permissão para jogar.", StatusCodes.Status403Forbidden);
        }

        var previousBest = await _db.GameScores
            .Where(s => s.Game == game && s.UserId == userId)
            .MaxAsync(s => (int?)s.Score, ct);

        _db.GameScores.Add(new GameScore
        {
            UserId = userId,
            Game = game,
            Score = request.Score,
            Lines = request.Lines,
            Level = request.Level
        });
        await _db.SaveChangesAsync(ct);

        var best = Math.Max(previousBest ?? 0, request.Score);
        var isNewRecord = previousBest is null || request.Score > previousBest;
        var position = await PositionAsync(game, best, ct);

        return new GameResultDto(request.Score, best, isNewRecord, position);
    }

    public async Task<List<GameRankingItemDto>> RankingAsync(string game, int take, CancellationToken ct)
    {
        EnsureGame(game);

        var rows = await _db.GameScores.AsNoTracking()
            .Where(s => s.Game == game && s.User.IsActive)
            .GroupBy(s => new { s.UserId, s.User.Name })
            .Select(g => new { g.Key.UserId, g.Key.Name, Best = g.Max(s => s.Score) })
            .OrderByDescending(x => x.Best)
            .ThenBy(x => x.Name)
            .Take(Math.Clamp(take, 1, 50))
            .ToListAsync(ct);

        return rows
            .Select((r, i) => new GameRankingItemDto(i + 1, r.UserId, r.Name, r.Best))
            .ToList();
    }

    public async Task<MyGameStatsDto> MyStatsAsync(string game, int userId, CancellationToken ct)
    {
        EnsureGame(game);

        var scores = _db.GameScores.Where(s => s.Game == game && s.UserId == userId);
        var plays = await scores.CountAsync(ct);

        if (plays == 0)
        {
            return new MyGameStatsDto(null, 0, null);
        }

        var best = await scores.MaxAsync(s => s.Score, ct);
        return new MyGameStatsDto(best, plays, await PositionAsync(game, best, ct));
    }

    private async Task<int> PositionAsync(string game, int best, CancellationToken ct)
    {
        var playersAhead = await _db.GameScores
            .Where(s => s.Game == game && s.User.IsActive)
            .GroupBy(s => s.UserId)
            .Select(g => g.Max(s => s.Score))
            .Where(b => b > best)
            .CountAsync(ct);

        return playersAhead + 1;
    }

    private static void EnsureGame(string game)
    {
        if (!GameCatalog.Exists(game))
        {
            throw new AppException("Jogo não encontrado.", StatusCodes.Status404NotFound);
        }
    }

    // Recusa pontuações impossíveis pelas regras do Tetris do front:
    // nível = linhas / 10 + 1; linha vale até 200 x nível (tetris = 800 x nível para 4 linhas);
    // cada peça soma no máximo 40 pontos de queda (2 por célula, 20 células).
    private static void ValidateTetrisScore(SubmitScoreRequest request)
    {
        if (request.Level != request.Lines / 10 + 1)
        {
            throw new AppException("Pontuação inválida.");
        }

        long maxPieces = (request.Lines * 10L + 200) / 4 + 1;
        long maxScore = 200L * request.Lines * request.Level + 40L * maxPieces;

        if (request.Score > maxScore)
        {
            throw new AppException("Pontuação inválida.");
        }
    }
}
