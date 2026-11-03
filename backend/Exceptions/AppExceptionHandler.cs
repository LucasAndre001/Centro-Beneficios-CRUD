using Microsoft.AspNetCore.Diagnostics;

namespace CentroBeneficios.Api.Exceptions;

public class AppExceptionHandler : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(
        HttpContext context,
        Exception exception,
        CancellationToken cancellationToken)
    {
        if (exception is not AppException appException)
        {
            return false;
        }

        context.Response.StatusCode = appException.StatusCode;
        await context.Response.WriteAsJsonAsync(new { message = appException.Message }, cancellationToken);
        return true;
    }
}