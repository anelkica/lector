using Lector.API.Models;

namespace Lector.API.Dtos;

// hide StorageName from frontend btw
public record ScanDto(
    Guid Id,
    string Alias,
    string? OcrResult,
    ScanStatus Status,
    DateTime CreatedAt,
    bool IsDuplicate = false
);