using Api.Contracts;
using Microsoft.Extensions.Options;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Processing;
using ResizeOptions = Api.Configuration.ResizeOptions;

namespace Api.Services;

/// <summary>
/// Resizes images, capping how many run concurrently. Resizing is CPU-bound and
/// each decoded image holds memory, so an unbounded burst of uploads would
/// saturate the server and stall every request — including other users'. The
/// semaphore admits only N at a time; the rest wait asynchronously.
/// </summary>
public sealed class ImageResizeService : IImageResizeService, IDisposable
{
    private readonly SemaphoreSlim _throttle;

    public ImageResizeService(IOptions<ResizeOptions> options) =>
        _throttle = new SemaphoreSlim(options.Value.EffectiveConcurrency);

    public async Task<ResizedImage> ResizeAsync(Stream input, int percentage, CancellationToken cancellationToken)
    {
        await _throttle.WaitAsync(cancellationToken);
        try
        {
            // Decode from the stream (no full byte[] buffer); `using` frees the bitmap right after.
            using var image = await Image.LoadAsync(input, cancellationToken);

            var format = image.Metadata.DecodedImageFormat
                         ?? throw new NotSupportedException("Unrecognized image format.");

            var width = Math.Max(1, image.Width * percentage / 100);
            var height = Math.Max(1, image.Height * percentage / 100);
            image.Mutate(context => context.Resize(width, height));

            var output = new MemoryStream();
            await image.SaveAsync(output, format, cancellationToken); // keep the original format
            output.Position = 0;

            return new ResizedImage(output, format.DefaultMimeType, format.FileExtensions.First());
        }
        finally
        {
            _throttle.Release(); // release even on failure, or slots leak
        }
    }

    public void Dispose() => _throttle.Dispose();
}
