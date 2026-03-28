using Microsoft.AspNetCore.Identity;
namespace Lector.API.Models;

public class ApplicationUser : IdentityUser
{
    public string? RefreshToken { get; set; }
    public DateTime? RefreshTokenExpiryTime { get; set; }

    public List<Scan> Scans { get; set; } = [];
}
