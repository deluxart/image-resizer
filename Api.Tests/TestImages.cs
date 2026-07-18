using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Formats;
using SixLabors.ImageSharp.Formats.Jpeg;
using SixLabors.ImageSharp.Formats.Png;
using SixLabors.ImageSharp.PixelFormats;

namespace Api.Tests;

/// <summary>Generates real in-memory JPEG/PNG images so tests need no binary fixtures.</summary>
internal static class TestImages
{
    public static byte[] Jpeg(int width, int height) => Encode(width, height, new JpegEncoder());

    public static byte[] Png(int width, int height) => Encode(width, height, new PngEncoder());

    private static byte[] Encode(int width, int height, IImageEncoder encoder)
    {
        using var image = new Image<Rgba32>(width, height);
        using var stream = new MemoryStream();
        image.Save(stream, encoder);
        return stream.ToArray();
    }
}
