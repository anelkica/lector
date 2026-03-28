using Lector.API.Data;
using Lector.API.Dtos;
using Lector.API.Models;
using Lector.API.Services;
using Lector.API.Utils;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.VisualBasic;
using System.Diagnostics;
using System.Security.Claims;

namespace Lector.API.Controllers;

[Authorize]
[Route("api/[controller]")]
[ApiController]
public class ScansController(IScannerService scanner, ILogger<ScansController> logger, AppDbContext db) : ControllerBase
{
    // hardcoded but eh, check Program.cs for folder init
    private readonly string _uploadsFolder = Path.Combine(AppContext.BaseDirectory, "uploads");

    [HttpGet]
    [EndpointDescription("List recent scans ordered by creation date")]
    public async Task<ActionResult<IEnumerable<ScanDto>>> GetScans(int limit = 50, CancellationToken cancellationToken = default)
    {
        string userId = GetUserId();

        var scans = await db.Scans
            .Where(scan => scan.UserId == userId)
            .OrderByDescending(scan => scan.CreatedAt)
            .Take(Math.Min(limit, 100))
            .ToListAsync(cancellationToken);

        return Ok(scans.Select(scan => scan.ToDto()));
    }

    [HttpGet("{id:guid}")]
    [EndpointDescription("Get details of a specific scan")]
    public async Task<ActionResult<ScanDto>> GetScan(Guid id, CancellationToken cancellationToken = default)
    {
        string userId = GetUserId();

        var scan = await db.Scans.FirstOrDefaultAsync(s => s.Id == id && s.UserId == userId, cancellationToken);
        if (scan is null)
            return NotFound($"Scan {id} not found");

        return Ok(scan.ToDto());
    }

    [HttpDelete("{id:guid}")]
    [EndpointDescription("Delete a scan record and its associated file")]
    public async Task<ActionResult> DeleteScan(Guid id, CancellationToken cancellationToken = default)
    {
        string userId = GetUserId();

        var scan = await db.Scans.FirstOrDefaultAsync(s => s.Id == id && s.UserId == userId, cancellationToken);
        if (scan is null)
            return NotFound($"Scan {id} not found");

        var filePath = Path.Combine(_uploadsFolder, scan.StorageName);
        if (System.IO.File.Exists(filePath))
            System.IO.File.Delete(filePath);
        else
            logger.LogWarning("File not found for deletion: {Path}", filePath);

        db.Scans.Remove(scan);
        await db.SaveChangesAsync(cancellationToken);

        logger.LogInformation("Deleted scan: {Id} ({Alias})", id, scan.Alias);
        return NoContent();
    }

    [HttpGet("{id:guid}/image")]
    public async Task<ActionResult> GetScanImage(Guid id, CancellationToken cancellationToken = default)
    {
        if (!Directory.Exists(_uploadsFolder)) return NotFound("Image not found");

        string userId = GetUserId();

        Scan? scan = await db.Scans.FirstOrDefaultAsync(scan => scan.Id == id && scan.UserId == userId, cancellationToken);
        if (scan is null)
            return NotFound($"Scan {id} not found");

        if (string.IsNullOrWhiteSpace(scan.StorageName)) return NotFound("Image not found");

        string uploadsRoot = Path.GetFullPath(_uploadsFolder) + Path.DirectorySeparatorChar;
        string fullPath = Path.GetFullPath(Path.Combine(_uploadsFolder, scan.StorageName));
        if (!fullPath.StartsWith(uploadsRoot, StringComparison.OrdinalIgnoreCase)) return Forbid();
        if (!System.IO.File.Exists(fullPath)) return NotFound("Image not found");

        var stream = new FileStream(
            fullPath, FileMode.Open, FileAccess.Read, FileShare.Read, bufferSize: 4096,
            options: FileOptions.Asynchronous | FileOptions.SequentialScan);

        var contentType = string.IsNullOrEmpty(scan.ContentType) ? "application/octet-stream" : scan.ContentType;
        return new FileStreamResult(stream, contentType);
    }

    [HttpPost]
    [EndpointDescription("Upload an image for OCR scanning. Returns recognized text from the image.")]
    public async Task<ActionResult<ScanDto>> ScanImage(IFormFile image, CancellationToken cancellationToken = default)
    {
        string userId = GetUserId();

        if (image is not { Length: > 0 })
            return BadRequest("No image uploaded");

        if (!image.ContentType.StartsWith("image/", StringComparison.OrdinalIgnoreCase))
            return BadRequest("Only image files allowed");

        await using MemoryStream ms = new();
        await image.CopyToAsync(ms, cancellationToken);
        ms.Position = 0;
        string hash = FileHasher.ComputeSHA256(ms);

        // check for duplicate from hash
        Scan? cached = await db.Scans.AsNoTracking().FirstOrDefaultAsync(scan => scan.Hash == hash, cancellationToken);
        if (cached is not null)
        {
            logger.LogInformation("Duplicate detected (hash {Hash}), returning cached result", hash);
            return Ok(cached.ToDto(isDuplicate: true));
        }

        // not cached? prepare to save to disk
        string ext = Path.GetExtension(image.FileName).ToLowerInvariant();
        string storageName = $"{Guid.NewGuid()}{ext}";
        string filePath = Path.Combine(_uploadsFolder, storageName);

        try
        {
            ms.Position = 0;
            await using FileStream fileStream = new(filePath, FileMode.Create);
            await ms.CopyToAsync(fileStream, cancellationToken);

            Stopwatch stopwatch = Stopwatch.StartNew();
            string result = await scanner.ScanAsync(filePath, cancellationToken);
            stopwatch.Stop();

            Scan scan = new()
            {
                Alias = image.FileName,
                StorageName = storageName,
                Hash = hash,
                OcrResult = result,
                Status = ScanStatus.Success,
                SizeBytes = image.Length,
                ContentType = image.ContentType,
                ScanDurationMs = (int)stopwatch.ElapsedMilliseconds,
                UserId = userId
            };

            db.Scans.Add(scan);
            await db.SaveChangesAsync(cancellationToken);

            logger.LogInformation("Scan completed: {Path} ({Duration}ms)", filePath, stopwatch.ElapsedMilliseconds);
            return Ok(scan.ToDto(isDuplicate: false));
        }
        catch (TimeoutException ex)
        {
            if (System.IO.File.Exists(filePath)) System.IO.File.Delete(filePath);

            logger.LogWarning(ex, "Scan timeout: {Path}", filePath);
            return StatusCode(504, ex.Message);
        }
        catch (Exception ex)
        {
            if (System.IO.File.Exists(filePath)) System.IO.File.Delete(filePath);

            logger.LogError(ex, "Scan failed: {Path} - {Message}", filePath, ex.Message);
            return StatusCode(500, $"Scan failed: {ex.Message}");
        }
    }

    private string GetUserId() => 
        User.FindFirstValue(ClaimTypes.NameIdentifier) ?? throw new InvalidOperationException("User ID claim missing");
}
