namespace Api.Contracts;

/// <summary>
/// The output of a resize operation: the image bytes plus what the controller
/// needs to stream them back to the client.
/// </summary>
public sealed record ResizedImage(Stream Content, string ContentType, string FileExtension);
