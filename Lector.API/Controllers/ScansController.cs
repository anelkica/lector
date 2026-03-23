using Lector.API.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Lector.API.Controllers;

[Route("api/[controller]")]
[ApiController]
public class ScansController(IScannerService scanner, ILogger<ScansController> logger) : ControllerBase
{
    private readonly string _uploadsFolder = Path.Combine(AppContext.BaseDirectory, "uploads");



    [HttpPost]
    [EndpointDescription("Upload an image for OCR scanning. Returns recognized text from the image.")]
    public async Task<ActionResult<string>> ScanImage(IFormFile image, CancellationToken cancellationToken)
    {
        if (image == null || image.Length == 0)
            return BadRequest("No image uploaded");

        if (!image.ContentType.StartsWith("image/", StringComparison.OrdinalIgnoreCase))
            return BadRequest("Only image files allowed");

        string ext = Path.GetExtension(image.FileName).ToLowerInvariant();
        string filename = $"{Guid.NewGuid()}{ext}";
        string filePath = Path.Combine(_uploadsFolder, filename);

        await using MemoryStream ms = new();
        await image.CopyToAsync(ms, cancellationToken);
        await System.IO.File.WriteAllBytesAsync(filePath, ms.ToArray(), cancellationToken);

        logger.LogInformation("Scanning image: {Path} ({Size} bytes)", filePath, image.Length);

        try
        {
            string result = await scanner.ScanAsync(filePath, cancellationToken);
            logger.LogInformation("Scan completed: {Path}", filePath);
            return Ok(new { text = result });
        }
        catch (TimeoutException ex)
        {
            logger.LogWarning(ex, "Scan timeout: {Path}", filePath);
            return StatusCode(504, ex.Message);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Scan failed: {Path} - {Message}", filePath, ex.Message);
            return StatusCode(500, $"Scan failed: {ex.Message}");
        }
    }
}
