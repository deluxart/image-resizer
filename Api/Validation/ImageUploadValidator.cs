using Api.Configuration;
using Api.Exceptions;
using Microsoft.Extensions.Options;

namespace Api.Validation;

/// <summary>
/// Validates an incoming resize request against the configured limits.
/// Lives outside the controller so the controller stays thin and the rules
/// are unit-testable in isolation. Throws <see cref="ImageValidationException"/>
/// on the first violation.
/// </summary>
public sealed class ImageUploadValidator(IOptions<ResizeOptions> options)
{
    private readonly ResizeOptions _options = options.Value;

    public void Validate(IFormFile? file, int percentage)
    {
        if (file is null || file.Length == 0)
            throw new ImageValidationException("No image was uploaded.");

        if (file.Length > _options.MaxImageBytes)
            throw new ImageValidationException("The image exceeds the maximum allowed size.");

        if (!_options.AllowedContentTypes.Contains(file.ContentType, StringComparer.OrdinalIgnoreCase))
            throw new ImageValidationException("Only JPEG and PNG images are supported.");

        if (percentage is < 0 or > 100)
            throw new ImageValidationException("Percentage must be between 0 and 100.");
    }
}
