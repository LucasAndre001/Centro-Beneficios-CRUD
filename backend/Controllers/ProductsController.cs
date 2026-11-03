using CentroBeneficios.Api.Dtos.Products;
using CentroBeneficios.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CentroBeneficios.Api.Controllers;

[ApiController]
[Route("api/products")]
[Authorize]
public class ProductsController : ControllerBase
{
    private readonly ProductService _products;

    public ProductsController(ProductService products)
    {
        _products = products;
    }

    [HttpGet]
    public async Task<ActionResult<List<CatalogProductDto>>> List(CancellationToken ct)
    {
        return Ok(await _products.ListCatalogAsync(ct));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<CatalogProductDto>> Get(int id, CancellationToken ct)
    {
        return Ok(await _products.GetCatalogAsync(id, ct));
    }
}