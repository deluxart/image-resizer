namespace Api.Exceptions;

/// <summary>
/// Thrown when an incoming request is not a valid resize request
/// (missing file, wrong format, out-of-range percentage, too large).
/// Translated to an HTTP 4xx by the exception-handling middleware.
/// </summary>
public sealed class ImageValidationException(string message) : Exception(message);
