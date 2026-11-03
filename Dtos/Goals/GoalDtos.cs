using System.ComponentModel.DataAnnotations;

namespace CentroBeneficios.Api.Dtos.Goals;

public record GoalsDto(int? Day, int? Week, int? Month);

public class UpdateGoalsRequest
{
    [Range(1, 100_000)]
    public int? Day { get; set; }

    [Range(1, 100_000)]
    public int? Week { get; set; }

    [Range(1, 100_000)]
    public int? Month { get; set; }
}