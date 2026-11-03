namespace CentroBeneficios.Api.Entities;

public class GameScore
{
    public int Id { get; set; }

    public int UserId { get; set; }
    public User User { get; set; } = null!;

    // Chave do jogo no GameCatalog (ex.: "tetris")
    public string Game { get; set; } = string.Empty;

    public int Score { get; set; }
    public int Lines { get; set; }
    public int Level { get; set; }

    public DateTime PlayedAt { get; set; } = DateTime.UtcNow;
}
