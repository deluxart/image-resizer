using Api.Contracts;

namespace Api.Services;

/// <summary>
/// Resizes a single image. Implementations must be safe to call concurrently.
/// </summary>
public interface IImageResizeService
{
    Task<ResizedImage> ResizeAsync(Stream input, int percentage, CancellationToken cancellationToken);
}
