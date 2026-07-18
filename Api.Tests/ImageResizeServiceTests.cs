using Api.Configuration;
using Api.Services;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Formats.Png;

namespace Api.Tests;

public sealed class ImageResizeServiceTests
{
    private static ImageResizeService CreateService(int concurrency = 4)
    {
        var options = Options.Create(new ResizeOptions { MaxConcurrentResizes = concurrency });
        return new ImageResizeService(options, NullLogger<ImageResizeService>.Instance);
    }

    private static async Task<Image> ResizeAndLoadAsync(byte[] source, int percentage)
    {
        using var service = CreateService();
        await using var input = new MemoryStream(source);
        var result = await service.ResizeAsync(input, percentage, CancellationToken.None);
        return await Image.LoadAsync(result.Content);
    }

    [Theory]
    [InlineData(50, 100, 50)]
    [InlineData(25, 50, 25)]
    [InlineData(100, 200, 100)]
    public async Task Resizes_to_the_expected_dimensions(int percentage, int expectedWidth, int expectedHeight)
    {
        using var image = await ResizeAndLoadAsync(TestImages.Jpeg(200, 100), percentage);

        Assert.Equal(expectedWidth, image.Width);
        Assert.Equal(expectedHeight, image.Height);
    }

    [Fact]
    public async Task Preserves_the_original_format()
    {
        using var service = CreateService();
        await using var input = new MemoryStream(TestImages.Png(120, 80));

        var result = await service.ResizeAsync(input, 50, CancellationToken.None);
        using var output = await Image.LoadAsync(result.Content);

        Assert.IsType<PngFormat>(output.Metadata.DecodedImageFormat);
        Assert.Equal("image/png", result.ContentType);
    }

    [Fact]
    public async Task Never_produces_a_zero_sized_image()
    {
        // 0% would naively be 0px; the service must clamp to at least 1px.
        using var image = await ResizeAndLoadAsync(TestImages.Jpeg(200, 100), 0);

        Assert.True(image.Width >= 1 && image.Height >= 1);
    }

    [Fact]
    public async Task Handles_many_concurrent_resizes_correctly()
    {
        // With a small concurrency cap, a burst of parallel requests must still
        // all complete with correct results (thread-safety + throttling).
        using var service = CreateService(concurrency: 2);
        var source = TestImages.Jpeg(300, 200);

        var tasks = Enumerable.Range(0, 16).Select(async _ =>
        {
            await using var input = new MemoryStream(source);
            var result = await service.ResizeAsync(input, 50, CancellationToken.None);
            using var image = await Image.LoadAsync(result.Content);
            return (image.Width, image.Height);
        });

        var results = await Task.WhenAll(tasks);

        Assert.All(results, r => Assert.Equal((150, 100), r));
    }
}
