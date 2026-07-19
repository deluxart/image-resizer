using System.ComponentModel.DataAnnotations;

namespace Api.Configuration;

/// <summary>Strongly-typed resize limits, bound and validated from the "Resize" config section.</summary>
public sealed class ResizeOptions
{
    public const string SectionName = "Resize";

    /// <summary>Max size of a single uploaded image, in bytes.</summary>
    [Range(1, long.MaxValue)]
    public long MaxImageBytes { get; init; } = 20 * 1024 * 1024;

    /// <summary>MIME types the API accepts.</summary>
    [Required, MinLength(1)]
    public string[] AllowedContentTypes { get; init; } = ["image/jpeg", "image/png"];

    /// <summary>
    /// How many resize operations may run at the same time. Resizing is
    /// CPU-bound, so 0 (the default) means "auto — use the number of cores".
    /// </summary>
    [Range(0, 1024)]
    public int MaxConcurrentResizes { get; init; }

    /// <summary>Resolved concurrency limit: the configured value, or CPU cores when 0.</summary>
    public int EffectiveConcurrency =>
        MaxConcurrentResizes > 0 ? MaxConcurrentResizes : Environment.ProcessorCount;

    /// <summary>Per-request timeout, in seconds (assignment requires 30s).</summary>
    [Range(1, 600)]
    public int RequestTimeoutSeconds { get; init; } = 30;
}
