using Api.Contracts;
using Microsoft.Extensions.Options;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Processing;
// Disambiguate from SixLabors.ImageSharp.Processing.ResizeOptions.
using ResizeOptions = Api.Configuration.ResizeOptions;

namespace Api.Services;

/// <summary>
/// Resizes images while capping how many run at once.
///
/// WHY the cap: resizing is CPU-bound and each decoded image lives in memory.
/// Without a limit, a burst of uploads would spin up hundreds of parallel
/// resizes, exhaust CPU and RAM, and stall every request — including other
/// users'. The semaphore admits only N at a time; the rest wait asynchronously.
/// This is the core of the "don't block other users' sessions" requirement.
/// </summary>
public sealed class ImageResizeService : IImageResizeService, IDisposable
{
    private readonly SemaphoreSlim _throttle;
    private readonly ILogger<ImageResizeService> _logger;

    public ImageResizeService(IOptions<ResizeOptions> options, ILogger<ImageResizeService> logger)
    {
        _throttle = new SemaphoreSlim(options.Value.EffectiveConcurrency);
        _logger = logger;
    }

    public async Task<ResizedImage> ResizeAsync(Stream input, int percentage, CancellationToken cancellationToken)
    {
        // Wait (without blocking a thread) for a free processing slot.
        await _throttle.WaitAsync(cancellationToken);
        try
        {
            // Decode straight from the upload stream — we never buffer the whole
            // file as a byte[]. `using` frees the decoded bitmap immediately after.
            using var image = await Image.LoadAsync(input, cancellationToken);

            var format = image.Metadata.DecodedImageFormat
                         ?? throw new NotSupportedException("Unrecognized image format.");

            // 0–100% of the original, never smaller than 1px.
            var width = Math.Max(1, image.Width * percentage / 100);
            var height = Math.Max(1, image.Height * percentage / 100);
            image.Mutate(context => context.Resize(width, height));

            // Re-encode in the same format the user uploaded.
            var output = new MemoryStream();
            await image.SaveAsync(output, format, cancellationToken);
            output.Position = 0;

            return new ResizedImage(output, format.DefaultMimeType, format.FileExtensions.First());
        }
        finally
        {
            // Always release, even on failure — otherwise slots leak and the
            // pipeline eventually deadlocks.
            _throttle.Release();
        }
    }

    public void Dispose() => _throttle.Dispose();
}
