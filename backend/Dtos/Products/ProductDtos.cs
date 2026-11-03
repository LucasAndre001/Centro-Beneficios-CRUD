using CentroBeneficios.Api.Entities;

namespace CentroBeneficios.Api.Dtos.Products;

public record ProductSummaryDto(
    int Id,
    string Name,
    string Description,
    int PointCost,
    int StockQuantity,
    bool HasImage,
    ProductStatus Status);

public record ProductDto(
    int Id,
    string Name,
    string Description,
    int PointCost,
    int StockQuantity,
    string? ImageDataUrl,
    ProductStatus Status,
    DateTime CreatedAt,
    DateTime UpdatedAt);

public record CatalogProductDto(
    int Id,
    string Name,
    string Description,
    int PointCost,
    int StockQuantity,
    string? ImageDataUrl);