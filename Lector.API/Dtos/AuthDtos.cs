using System.ComponentModel.DataAnnotations;

namespace Lector.API.Dtos;

public record RegisterRequest(
    [Required][EmailAddress] string Email,
    [Required][MinLength(8)] string Password
);

public record LoginRequest(
    [Required][EmailAddress] string Email,
    [Required] string Password
);

public record AuthResponse(string Email, DateTime AccessTokenExpires, string AccessToken, string RefreshToken, DateTime RefreshTokenExpires);
public record RefreshRequest();