using System.ComponentModel.DataAnnotations;

namespace CentroBeneficios.Api.Dtos.Games;

public record GameInfoDto(string Key, string Name);

public class SubmitScoreRequest
{
    [Range(0, 10_000_000)]
    public int Score { get; set; }

    [Range(0, 10_000)]
    public int Lines { get; set; }

    [Range(1, 1_001)]
    public int Level { get; set; }
}

public record GameResultDto(int Score, int BestScore, bool IsNewRecord, int Position);

public record GameRankingItemDto(int Position, int EmployeeId, string Name, int BestScore);

public record MyGameStatsDto(int? BestScore, int Plays, int? Position);
