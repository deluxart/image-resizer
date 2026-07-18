using Api.Services;
using Api.Validation;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class ResizeController(IImageResizeService resizeService, ImageUploadValidator validator)
    : ControllerBase
{
    /// <summary>
    /// POST /api/resize — multipart form with `file` and `percentage` (0..100).
    /// Returns the resized image as a downloadable file.
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> Resize(
        [FromForm] IFormFile? file,
        [FromForm] int percentage,
        CancellationToken cancellationToken)
    {
        validator.Validate(file, percentage);

        await using var input = file!.OpenReadStream();
        var result = await resizeService.ResizeAsync(input, percentage, cancellationToken);

        var downloadName = $"resized_{Path.GetFileNameWithoutExtension(file.FileName)}.{result.FileExtension}";
        return File(result.Content, result.ContentType, downloadName);
    }
}
