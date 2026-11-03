using CentroBeneficios.Api.Data;
using CentroBeneficios.Api.Dtos.Products;
using CentroBeneficios.Api.Entities;
using CentroBeneficios.Api.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace CentroBeneficios.Api.Services;

public class ProductService
{
    private static readonly string[] AllowedImagePrefixes =
    [
        "data:image/jpeg;base64,",
        "data:image/png;base64,",
        "data:image/webp;base64,"
    ];

    private readonly AppDbContext _db;

    public ProductService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<List<ProductSummaryDto>> ListAdminAsync(
        string? search, bool includeInactive, CancellationToken ct)
    {
        var query = _db.Products.AsNoTracking().AsQueryable();

        if (!includeInactive)
        {
            query = query.Where(p => p.Status != ProductStatus.Inactive);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var pattern = $"%{search.Trim()}%";
            query = query.Where(p => EF.Functions.ILike(p.Name, pattern));
        }

        return await query
            .OrderBy(p => p.Name)
            .Select(p => new ProductSummaryDto(
                p.Id, p.Name, p.Description, p.PointCost, p.StockQuantity,
                p.ImageDataUrl != null, p.Status))
            .ToListAsync(ct);
    }

    public async Task<ProductDto> GetAdminAsync(int id, CancellationToken ct)
    {
        return ToDto(await FindAsync(id, ct));
    }

    public async Task<ProductDto> CreateAsync(ProductRequest request, CancellationToken ct)
    {
        Validate(request);

        var product = new Product();
        Apply(product, request);
        _db.Products.Add(product);

        await _db.SaveChangesAsync(ct);
        return ToDto(product);
    }

    public async Task<ProductDto> UpdateAsync(int id, ProductRequest request, CancellationToken ct)
    {
        Validate(request);

        var product = await FindAsync(id, ct);

        if (product.Status == ProductStatus.Inactive)
        {
            throw new AppException(
                "Produto desativado. Reative-o antes de editar.", StatusCodes.Status409Conflict);
        }

        Apply(product, request);

        await _db.SaveChangesAsync(ct);
        return ToDto(product);
    }

    public async Task<ProductDto> SetStatusAsync(int id, ProductStatus status, CancellationToken ct)
    {
        var product = await FindAsync(id, ct);

        if (status == ProductStatus.Published && product.PointCost <= 0)
        {
            throw new AppException("Para publicar, o custo em pontos deve ser maior que zero.");
        }

        product.Status = status;
        product.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);
        return ToDto(product);
    }

    public async Task<List<CatalogProductDto>> ListCatalogAsync(CancellationToken ct)
    {
        return await _db.Products.AsNoTracking()
            .Where(p => p.Status == ProductStatus.Published)
            .OrderBy(p => p.Name)
            .Select(p => new CatalogProductDto(
                p.Id, p.Name, p.Description, p.PointCost, p.StockQuantity, p.ImageDataUrl))
            .ToListAsync(ct);
    }

    public async Task<CatalogProductDto> GetCatalogAsync(int id, CancellationToken ct)
    {
        var product = await _db.Products.AsNoTracking()
            .Where(p => p.Id == id && p.Status == ProductStatus.Published)
            .Select(p => new CatalogProductDto(
                p.Id, p.Name, p.Description, p.PointCost, p.StockQuantity, p.ImageDataUrl))
            .FirstOrDefaultAsync(ct);

        return product ?? throw new AppException("Produto não encontrado.", StatusCodes.Status404NotFound);
    }

    private async Task<Product> FindAsync(int id, CancellationToken ct)
    {
        var product = await _db.Products.FirstOrDefaultAsync(p => p.Id == id, ct);

        return product ?? throw new AppException("Produto não encontrado.", StatusCodes.Status404NotFound);
    }

    private static void Validate(ProductRequest request)
    {
        if (request.Publish && request.PointCost <= 0)
        {
            throw new AppException("Para publicar, o custo em pontos deve ser maior que zero.");
        }

        if (!string.IsNullOrEmpty(request.ImageDataUrl))
        {
            ValidateImage(request.ImageDataUrl);
        }
    }

    private static void ValidateImage(string image)
    {
        var prefix = AllowedImagePrefixes.FirstOrDefault(p => image.StartsWith(p, StringComparison.Ordinal));

        if (prefix is null)
        {
            throw new AppException("A imagem deve ser JPEG, PNG ou WebP.");
        }

        var base64 = image[prefix.Length..];

        if (!Convert.TryFromBase64String(base64, new byte[base64.Length], out _))
        {
            throw new AppException("A imagem enviada está corrompida.");
        }
    }

    private static void Apply(Product product, ProductRequest request)
    {
        product.Name = request.Name.Trim();
        product.Description = request.Description?.Trim() ?? string.Empty;
        product.PointCost = request.PointCost;
        product.StockQuantity = request.StockQuantity;
        product.ImageDataUrl = string.IsNullOrEmpty(request.ImageDataUrl) ? null : request.ImageDataUrl;
        product.Status = request.Publish ? ProductStatus.Published : ProductStatus.Draft;
        product.UpdatedAt = DateTime.UtcNow;
    }

    private static ProductDto ToDto(Product p) =>
        new(p.Id, p.Name, p.Description, p.PointCost, p.StockQuantity,
            p.ImageDataUrl, p.Status, p.CreatedAt, p.UpdatedAt);
}