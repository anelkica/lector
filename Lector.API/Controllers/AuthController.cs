using Lector.API.Dtos;
using Lector.API.Models;
using Lector.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using System.Runtime.InteropServices;
using System.Security.Claims;

namespace Lector.API.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(ITokenService tokenService, UserManager<ApplicationUser> manager) : ControllerBase
{

    [HttpPost("register")]
    [EndpointDescription("Registers a new user account")]
    public async Task<ActionResult> Register([FromBody] RegisterRequest request)
    {
        ApplicationUser? existingUser = await manager.FindByEmailAsync(request.Email);
        if (existingUser is not null)
            return BadRequest("Email already registered");

        ApplicationUser user = new()
        {
            UserName = request.Email,
            Email = request.Email,
            EmailConfirmed = true // LAN tool just skip it asap
        };

        IdentityResult result = await manager.CreateAsync(user, request.Password);
        if (!result.Succeeded)
            return BadRequest(result.Errors);

        AuthResponse tokens = await tokenService.GenerateTokensAsync(user);

        SetRefreshTokenCookie(tokens.RefreshToken, tokens.RefreshTokenExpires);
        SetAccessTokenCookie(tokens.AccessToken, tokens.AccessTokenExpires);

        return Ok(tokens);
    }

    [HttpPost("login")]
    [EndpointDescription("Authenticates a user and returns tokens")]
    public async Task<ActionResult> Login([FromBody] LoginRequest request)
    {
        ApplicationUser? user = await manager.FindByEmailAsync(request.Email);
        if (user is null)
            return Unauthorized("Invalid email or password");

        bool valid = await manager.CheckPasswordAsync(user, request.Password);
        if (!valid)
            return Unauthorized("Invalid email or password");

        AuthResponse tokens = await tokenService.GenerateTokensAsync(user);

        SetRefreshTokenCookie(tokens.RefreshToken, tokens.RefreshTokenExpires);
        SetAccessTokenCookie(tokens.AccessToken, tokens.AccessTokenExpires);

        return Ok(tokens);
    }

    [Authorize]
    [HttpPost("logout")]
    [EndpointDescription("Logs out the current user and clears tokens")]
    public async Task<ActionResult> Logout()
    {
        var user = await GetCurrentUserAsync();
        if (user == null)
            return Unauthorized();

        user.RefreshToken = null;
        user.RefreshTokenExpiryTime = null;
        await manager.UpdateAsync(user);

        Response.Cookies.Delete("AccessToken");
        Response.Cookies.Delete("RefreshToken");

        return Ok("Logged out");
    }

    [Authorize]
    [HttpGet("me")]
    [EndpointDescription("Gets the current authenticated user's profile")]
    public async Task<IActionResult> GetCurrentUser()
    {
        var user = await GetCurrentUserAsync();
        if (user == null)
            return NotFound();

        return Ok(new { user.Email, user.UserName });
    }

    private async Task<ApplicationUser?> GetCurrentUserAsync()
    {
        string? userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return null;

        return await manager.FindByIdAsync(userId);
    }

    private void SetRefreshTokenCookie(string token, DateTime expires)
    {
        CookieOptions options = new()
        {
            HttpOnly = true,
            Expires = expires,
            Secure = false,
            SameSite = SameSiteMode.Strict,
            Path = "/api/auth/refresh"
        };

        Response.Cookies.Append("RefreshToken", token, options);
    }

    private void SetAccessTokenCookie(string token, DateTime expires)
    {
        CookieOptions cookieOptions = new()
        {
            HttpOnly = true,
            Expires = expires,
            Secure = false,
            SameSite = SameSiteMode.Strict,
            Path = "/"
        };

        Response.Cookies.Append("AccessToken", token, cookieOptions);
    }
}
