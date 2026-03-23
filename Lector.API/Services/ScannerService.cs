using System.Diagnostics;

namespace Lector.API.Services;

// place in separate file if it starts growing
public interface IScannerService
{
    Task<string> ScanAsync(string imagePath, CancellationToken cancellationToken = default);
}

public class ScannerService(IConfiguration config, ILogger<ScannerService> logger) : IScannerService
{
    private readonly string _scannerPath = ValidateScannerPath(config["Scanner:Path"]);
    private readonly TimeSpan _timeout = TimeSpan.FromSeconds(35);

    private static string ValidateScannerPath(string? path)
    {
        if (string.IsNullOrEmpty(path))
            throw new InvalidOperationException("Scanner:Path not configured");

        if (!File.Exists(path))
            throw new FileNotFoundException($"Scanner binary not found: {path}");

        return path;
    }

    public async Task<string> ScanAsync(string imagePath, CancellationToken cancellationToken = default)
    {
        logger.LogDebug("Scan request received: {Image}", imagePath);

        if (!File.Exists(imagePath))
        {
            logger.LogWarning("Image not found: {Image}", imagePath);
            throw new FileNotFoundException("Image to scan not found", imagePath);
        }

        using CancellationTokenSource cts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        cts.CancelAfter(_timeout);

        using Process process = new()
        {
            StartInfo = new ProcessStartInfo
            {
                FileName = _scannerPath,
                WorkingDirectory = Path.GetDirectoryName(_scannerPath)!,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true
            }
        };

        process.StartInfo.ArgumentList.Add(imagePath);

        try
        {
            logger.LogDebug("Starting scanner: {Path} {Image}", _scannerPath, imagePath);
            process.Start();

            Task<string> stdoutTask = process.StandardOutput.ReadToEndAsync(cts.Token);
            Task<string> stderrTask = process.StandardError.ReadToEndAsync(cts.Token);

            await process.WaitForExitAsync(cts.Token);
            await Task.WhenAll(stdoutTask, stderrTask);

            string stdout = await stdoutTask;
            string stderr = await stderrTask;

            if (process.ExitCode != 0)
            {
                logger.LogError("Scanner failed (exit {ExitCode}): {Error}", process.ExitCode, stderr);
                throw new Exception($"Scanner failed: {stderr}");
            }

            return stdout.Trim();
        }
        catch (OperationCanceledException) when (!cancellationToken.IsCancellationRequested)
        {
            logger.LogError("Scanner timed out after {Timeout}", _timeout);
            if (!process.HasExited) process.Kill(true);
            throw new TimeoutException($"Scanner timed out after {_timeout.TotalSeconds}s");
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Scanner error: {Message}", ex.Message);
            throw;
        }
        finally
        {
            if (!process.HasExited)
            {
                logger.LogDebug("Cleaning up process");
                try { process.Kill(true); }
                catch { /* ignore - process already gone */ }
            }
        }
    }
}
