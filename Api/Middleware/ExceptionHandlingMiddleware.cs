using Api.Exceptions;

namespace Api.Middleware;

/// <summary>
/// One place that turns exceptions into HTTP responses. Controllers and
/// services just throw meaningful exceptions; the mapping to status codes and
/// the JSON error shape live here, so error handling is consistent and the rest
/// of the code stays free of repetitive try/catch blocks.
/// </summary>
public sealed class ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (Exception exception)
        {
            var (status, message) = Map(exception);

            if (status >= StatusCodes.Status500InternalServerError)
                logger.LogError(exception, "Unhandled error processing {Path}", context.Request.Path);

            context.Response.StatusCode = status;
            context.Response.ContentType = "application/json";
            await context.Response.WriteAsJsonAsync(new { error = message });
        }
    }

    private static (int Status, string Message) Map(Exception exception) => exception switch
    {
        ImageValidationException => (StatusCodes.Status400BadRequest, exception.Message),
        NotSupportedException => (StatusCodes.Status415UnsupportedMediaType, "Unsupported image format."),
        OperationCanceledException => (StatusCodes.Status408RequestTimeout, "The request timed out."),
        _ => (StatusCodes.Status500InternalServerError, "Could not process the image."),
    };
}
