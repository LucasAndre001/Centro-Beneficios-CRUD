using System.ComponentModel.DataAnnotations;
using CentroBeneficios.Api.Entities;

namespace CentroBeneficios.Api.Dtos.Products;

public class ProductRequest
{
    [Required, MaxLength(120)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Description { get; set; }

    [Range(0, 1_000_000)]
    public int PointCost { get; set; }

    [Range(0, 1_000_000)]
    public int StockQuantity { get; set; }

    [MaxLength(1_000_000)]
    public string? ImageDataUrl { get; set; }

    public bool Publish { get; set; }
}

public class UpdateProductStatusRequest
{
    [EnumDataType(typeof(ProductStatus))]
    public ProductStatus Status { get; set; }
}