using Lector.API.Dtos;
using Lector.API.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;


/*
 * this handles JWT access token generation and refresh token management
 *
 * flow:
 *   1. user logs in -> GenerateTokensAsync creates:
 *      - access token signed with HS256
 *      - refresh token stored in DB
 *   2. access token expires -> client calls /api/auth/refresh:
 *      - RefreshTokensAsync validates refresh token against DB
 *      - old token invalidated before new one generated (rotation)
 *      - returns new access + refresh token pair
 *   3. logout -> refresh token cleared from DB, cookies deleted
 *
 * security:
 *   - XSS protection: tokens are delivered via httpOnly cookies
 *   - replay attacks: refresh token rotation prevents it
 *   
 *   i mean it's just a LAN home scoped tool, but just in case
 */

namespace Lector.API.Services;

// small interface, if it grows create separate interface file
public interface ITokenService
{
    Task<AuthResponse> GenerateTokensAsync(ApplicationUser user);
    Task<AuthResponse?> RefreshTokensAsync(string refreshToken);
}

public class TokenService(IConfiguration config, UserManager<ApplicationUser> manager) : ITokenService
{
    private readonly SymmetricSecurityKey _key = new(
        Encoding.UTF8.GetBytes(config["Jwt:Key"] ?? throw new InvalidOperationException("JWT key not configured"))
    );

    public async Task<AuthResponse> GenerateTokensAsync(ApplicationUser user)
    {
        List<Claim> claims =
        [
            new(ClaimTypes.NameIdentifier, user.Id),
            new(ClaimTypes.Email, user.Email!),
            new(ClaimTypes.Name, user.UserName!)
        ];

        SigningCredentials credentials = new(_key, SecurityAlgorithms.HmacSha256);
        DateTime tokenExpiration = DateTime.UtcNow.AddMinutes(config.GetValue<int>("Jwt:AccessTokenExpirationMinutes"));

        JwtSecurityToken token = new(
            issuer: config["Jwt:Issuer"],
            audience: config["Jwt:Audience"],
            claims: claims,
            expires: tokenExpiration,
            signingCredentials: credentials
        );

        string jwt = new JwtSecurityTokenHandler().WriteToken(token);
        string refreshToken = Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));
        DateTime refreshExpiration = DateTime.UtcNow.AddDays(config.GetValue<int>("Jwt:RefreshTokenExpirationDays"));


        user.RefreshToken = refreshToken;
        user.RefreshTokenExpiryTime = refreshExpiration;
        await manager.UpdateAsync(user);

        return new AuthResponse(user.Email!, tokenExpiration, jwt, refreshToken, refreshExpiration);
    }

    public async Task<AuthResponse?> RefreshTokensAsync(string refreshToken)
    {
        ApplicationUser? user = await manager.Users.FirstOrDefaultAsync(user => user.RefreshToken == refreshToken);

        if (user is null) return null;
        if (user.RefreshTokenExpiryTime <= DateTime.UtcNow) return null;

        // invalidate old token before generating new ones
        user.RefreshToken = null;
        user.RefreshTokenExpiryTime = null;
        await manager.UpdateAsync(user);

        return await GenerateTokensAsync(user);
    }
}
