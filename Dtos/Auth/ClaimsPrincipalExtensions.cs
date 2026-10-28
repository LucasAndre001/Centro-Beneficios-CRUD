using System.Security.Claims;

namespace CentroBeneficios.Api.Extensions;

public static class ClaimsPrincipalExtensions
{
    public static int GetUserId(this ClaimsPrincipal user)
    {
        var value = user.FindFirst("sub")?.Value
            ?? throw new InvalidOperationException("Token sem a claim 'sub'.");

        return int.Parse(value);
    }
}