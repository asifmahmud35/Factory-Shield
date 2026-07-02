using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using FactoryShield.Application.Auth.Commands;
using FactoryShield.Application.Common.Interfaces;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FactoryShield.Api.Controllers;

[ApiController]
[Route("api/v1/auth")]
public class AuthController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly IUserRepository _users;
    private readonly IAdminRepository _admin;

    public AuthController(IMediator mediator, IUserRepository users, IAdminRepository admin)
    {
        _mediator = mediator;
        _users = users;
        _admin = admin;
    }

    public record LoginRequest(string Email, string Password);

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginRequest request)
    {
        var result = await _mediator.Send(new LoginCommand(request.Email, request.Password));
        if (result is null)
            return Unauthorized(new { error = "Invalid email or password." });
        return Ok(result);
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> Me(CancellationToken ct)
    {
        var rawId = User.FindFirstValue(JwtRegisteredClaimNames.Sub)
                    ?? User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (!Guid.TryParse(rawId, out var userId))
            return Unauthorized(new { error = "Invalid token." });

        var user = await _users.FindByIdWithRoleAsync(userId, ct);
        if (user is null)
            return Unauthorized(new { error = "User not found." });

        var factories = await _admin.GetFactoriesAsync(ct);
        var primary = factories.FirstOrDefault(f => f.Active) ?? factories.FirstOrDefault();

        return Ok(new
        {
            userId = user.Id,
            email = user.Email,
            role = user.Role.Code,
            name = user.Name,
            roleLabel = user.Role.Label,
            factoryName = primary?.Name,
            factoryLocation = primary?.Location,
        });
    }

    [Authorize]
    [HttpPost("logout")]
    public IActionResult Logout() => Ok(new { message = "Logged out." });
}
