using CentroBeneficios.Api.Dtos.Games;

namespace CentroBeneficios.Api.Services;

public static class GameCatalog
{
    public const string Tetris = "tetris";

    public static readonly IReadOnlyList<GameInfoDto> Available =
    [
        new GameInfoDto(Tetris, "Tetris")
    ];

    public static bool Exists(string key) => Available.Any(g => g.Key == key);
}
