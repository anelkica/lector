using Lector.API.Data;
using Lector.API.Models;
using Lector.API.Services;
using Lector.API.Utils;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Diagnostics;

namespace Lector.API.Controllers;

[Route("api/[controller]")]
[ApiController]
public class ScansController(IScannerService scanner, ILogger<ScansController> logger, AppDbContext db) : ControllerBase
{
    // hardcoded but eh, check Program.cs for folder init
    private readonly string _uploadsFolder = Path.Combine(AppContext.BaseDirectory, "uploads");

    [HttpPost]
    [EndpointDescription("Upload an image for OCR scanning. Returns recognized text from the image.")]
    public async Task<ActionResult<ScanDto>> ScanImage(IFormFile image, CancellationToken cancellationToken)
    {
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
            return Ok(cached.ToDto());
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
                ScanDurationMs = (int)stopwatch.ElapsedMilliseconds
            };

            db.Scans.Add(scan);
            await db.SaveChangesAsync(cancellationToken);

            logger.LogInformation("Scan completed: {Path}, {Duration}ms)", filePath, stopwatch.ElapsedMilliseconds);
            return Ok(scan.ToDto());
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
}
