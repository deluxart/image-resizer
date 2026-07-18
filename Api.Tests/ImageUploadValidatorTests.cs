using Api.Configuration;
using Api.Exceptions;
using Api.Validation;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;

namespace Api.Tests;

public sealed class ImageUploadValidatorTests
{
    private static ImageUploadValidator CreateValidator(ResizeOptions? options = null) =>
        new(Options.Create(options ?? new ResizeOptions()));

    private static IFormFile FakeFile(byte[] bytes, string contentType, string name = "test.jpg")
    {
        var stream = new MemoryStream(bytes);
        return new FormFile(stream, 0, bytes.Length, "file", name) { Headers = new HeaderDictionary(), ContentType = contentType };
    }

    [Fact]
    public void Valid_request_passes()
    {
        var validator = CreateValidator();
        var file = FakeFile(TestImages.Jpeg(100, 100), "image/jpeg");

        var act = () => validator.Validate(file, 50);

        act(); // does not throw
    }

    [Fact]
    public void Null_file_is_rejected()
    {
        var validator = CreateValidator();
        Assert.Throws<ImageValidationException>(() => validator.Validate(null, 50));
    }

    [Fact]
    public void Empty_file_is_rejected()
    {
        var validator = CreateValidator();
        var file = FakeFile([], "image/jpeg");
        Assert.Throws<ImageValidationException>(() => validator.Validate(file, 50));
    }

    [Fact]
    public void Unsupported_content_type_is_rejected()
    {
        var validator = CreateValidator();
        var file = FakeFile([1, 2, 3], "text/plain", "note.txt");
        Assert.Throws<ImageValidationException>(() => validator.Validate(file, 50));
    }

    [Theory]
    [InlineData(-1)]
    [InlineData(101)]
    [InlineData(999)]
    public void Out_of_range_percentage_is_rejected(int percentage)
    {
        var validator = CreateValidator();
        var file = FakeFile(TestImages.Jpeg(10, 10), "image/jpeg");
        Assert.Throws<ImageValidationException>(() => validator.Validate(file, percentage));
    }

    [Theory]
    [InlineData(0)]
    [InlineData(100)]
    public void Boundary_percentages_are_allowed(int percentage)
    {
        var validator = CreateValidator();
        var file = FakeFile(TestImages.Jpeg(10, 10), "image/jpeg");
        validator.Validate(file, percentage); // does not throw
    }

    [Fact]
    public void File_over_size_limit_is_rejected()
    {
        var validator = CreateValidator(new ResizeOptions { MaxImageBytes = 10 });
        var file = FakeFile(TestImages.Jpeg(100, 100), "image/jpeg"); // well over 10 bytes
        Assert.Throws<ImageValidationException>(() => validator.Validate(file, 50));
    }
}
