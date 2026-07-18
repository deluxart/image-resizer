using System.Net;
using System.Net.Http.Headers;
using Microsoft.AspNetCore.Mvc.Testing;
using SixLabors.ImageSharp;

namespace Api.Tests;

/// <summary>
/// End-to-end tests that spin up the real API in-memory and exercise the full
/// pipeline: validation -> resize service -> response codes and body.
/// </summary>
public sealed class ResizeEndpointTests(WebApplicationFactory<Program> factory)
    : IClassFixture<WebApplicationFactory<Program>>
{
    private static MultipartFormDataContent BuildForm(byte[] image, string contentType, int percentage, string name = "photo.jpg")
    {
        var fileContent = new ByteArrayContent(image);
        fileContent.Headers.ContentType = new MediaTypeHeaderValue(contentType);

        return new MultipartFormDataContent
        {
            { fileContent, "file", name },
            { new StringContent(percentage.ToString()), "percentage" },
        };
    }

    [Fact]
    public async Task Valid_request_returns_a_resized_image()
    {
        var client = factory.CreateClient();

        using var form = BuildForm(TestImages.Jpeg(400, 200), "image/jpeg", 50);
        var response = await client.PostAsync("/api/resize", form);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("image/jpeg", response.Content.Headers.ContentType?.MediaType);

        using var image = await Image.LoadAsync(await response.Content.ReadAsStreamAsync());
        Assert.Equal(200, image.Width);
        Assert.Equal(100, image.Height);
    }

    [Fact]
    public async Task Out_of_range_percentage_returns_400()
    {
        var client = factory.CreateClient();

        using var form = BuildForm(TestImages.Jpeg(100, 100), "image/jpeg", 150);
        var response = await client.PostAsync("/api/resize", form);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Unsupported_format_returns_400()
    {
        var client = factory.CreateClient();

        using var form = BuildForm([1, 2, 3], "text/plain", 50, "note.txt");
        var response = await client.PostAsync("/api/resize", form);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Response_includes_a_download_filename()
    {
        var client = factory.CreateClient();

        using var form = BuildForm(TestImages.Png(100, 100), "image/png", 50, "avatar.png");
        var response = await client.PostAsync("/api/resize", form);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Contains("resized_avatar", response.Content.Headers.ContentDisposition?.FileName ?? "");
    }
}
