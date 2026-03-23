using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;

namespace Lector.API.Models;

/// <summary>OCR processing status.</summary>
public enum ScanStatus { Pending, Success, Error, Timeout }

/// <summary>Represents an OCR scan result with metadata for history and deduplication.</summary>
[Index(nameof(Hash))]
[Index(nameof(CreatedAt))]
public class Scan
{
    /// <summary>Unique scan identifier for API endpoints.</summary>
    [Key]
    public Guid Id { get; init; } = Guid.NewGuid();

    /// <summary>Original filename for UI display (not used for storage).</summary>
    [Required, MaxLength(255)]
    public string Alias { get; init; } = string.Empty;

    /// <summary>GUID filename on disk.</summary>
    [Required, MaxLength(128)]
    public string StorageName { get; init; } = string.Empty;

    /// <summary>SHA256 hash for deduplication (skips OCR if exists).</summary>
    [Required, MaxLength(64)]
    public string Hash { get; init; } = string.Empty;

    /// <summary>OCR-extracted text (null if failed/pending).</summary>
    public string? OcrResult { get; set; }

    /// <summary>Processing status.</summary>
    public ScanStatus Status { get; set; } = ScanStatus.Pending;

    /// <summary>Error message (null on success).</summary>
    public string? ErrorMessage { get; set; }

    /// <summary>Original file size in bytes.</summary>
    public long SizeBytes { get; init; }

    /// <summary>MIME type for validation and serving.</summary>
    public string ContentType { get; init; } = "image/jpeg";

    /// <summary>OCR duration in milliseconds (includes C++ execution).</summary>
    public int ScanDurationMs { get; set; }

    /// <summary>UTC creation timestamp for sorting/filtering.</summary>
    public DateTime CreatedAt { get; init; } = DateTime.UtcNow;
}
