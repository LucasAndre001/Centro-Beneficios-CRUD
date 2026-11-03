using CentroBeneficios.Api.Dtos.Products;
using CentroBeneficios.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CentroBeneficios.Api.Controllers;

[ApiController]
[Route("api/admin/products")]
[Authorize(Policy = "AdminOnly")]
public class AdminProductsController : ControllerBase
{
    private readonly ProductService _products;

    public AdminProductsController(ProductService products)
    {
        _products = products;
    }

    [HttpGet]
    public async Task<ActionResult<List<ProductSummaryDto>>> List(
        [FromQuery] string? search,
        [FromQuery] bool includeInactive,
        CancellationToken ct)
    {
        return Ok(await _products.ListAdminAsync(search, includeInactive, ct));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ProductDto>> Get(int id, CancellationToken ct)
    {
        return Ok(await _products.GetAdminAsync(id, ct));
    }

    [HttpPost]
    public async Task<ActionResult<ProductDto>> Create(ProductRequest request, CancellationToken ct)
    {
        var product = await _products.CreateAsync(request, ct);
        return CreatedAtAction(nameof(Get), new { id = product.Id }, product);
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<ProductDto>> Update(int id, ProductRequest request, CancellationToken ct)
    {
        return Ok(await _products.UpdateAsync(id, request, ct));
    }

    [HttpPatch("{id:int}/status")]
    public async Task<ActionResult<ProductDto>> UpdateStatus(
        int id, UpdateProductStatusRequest request, CancellationToken ct)
    {
        return Ok(await _products.SetStatusAsync(id, request.Status, ct));
    }
}