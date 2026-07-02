using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;
using FactoryShield.Application.Common.Interfaces;
using FactoryShield.Application.QrCodes.Queries;
using FactoryShield.Domain.Entities;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FactoryShield.Api.Controllers;

[ApiController]
[Route("api/v1/qr")]
public class QrController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly IQrCodeRepository _qrCodes;

    public QrController(IMediator mediator, IQrCodeRepository qrCodes)
    {
        _mediator = mediator;
        _qrCodes = qrCodes;
    }

    /// <summary>Scan a QR code — returns pre-fill context. No auth required (anonymous scanning).</summary>
    [HttpGet("{code}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetContext(string code, CancellationToken ct)
    {
        try
        {
            var result = await _mediator.Send(new GetQrContextQuery(code), ct);
            return Ok(result);
        }
        catch (KeyNotFoundException ex) { return NotFound(new { error = ex.Message }); }
    }

    /// <summary>List all QR codes — admin only.</summary>
    [HttpGet]
    [Authorize(Policy = "GovernanceOnly")]
    public async Task<IActionResult> List(CancellationToken ct)
    {
        var codes = await _qrCodes.GetAllAsync(ct);
        return Ok(codes.Select(q => new
        {
            q.Id, q.Code, q.QrType, q.Label,
            q.FactoryId, q.SectionId, q.LineId, q.MachineId,
            q.IsActive, q.ScanCount, q.LastScannedAt, q.CreatedAt
        }));
    }

    /// <summary>Create a QR code — admin only.</summary>
    [HttpPost]
    [Authorize(Policy = "GovernanceOnly")]
    public async Task<IActionResult> Create([FromBody] CreateQrRequest request, CancellationToken ct)
    {
        var sub = User.FindFirstValue(JwtRegisteredClaimNames.Sub)
                  ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(sub, out var createdById)) return Unauthorized();

        var qr = new QrCode
        {
            Id = Guid.NewGuid(),
            Code = request.Code,
            QrType = request.QrType,
            FactoryId = request.FactoryId,
            SectionId = request.SectionId,
            LineId = request.LineId,
            MachineId = request.MachineId,
            Label = request.Label,
            IsActive = true,
            CreatedById = createdById,
            CreatedAt = DateTime.UtcNow,
        };

        await _qrCodes.AddAsync(qr, ct);
        await _qrCodes.SaveChangesAsync(ct);

        return StatusCode(201, new { qr.Id, qr.Code, qr.Label });
    }

    /// <summary>Activate or deactivate a QR code — admin only.</summary>
    [HttpPut("{id:guid}")]
    [Authorize(Policy = "GovernanceOnly")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateQrRequest request, CancellationToken ct)
    {
        var sub = User.FindFirstValue(JwtRegisteredClaimNames.Sub)
                  ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(sub, out var actorId)) return Unauthorized();

        var all = await _qrCodes.GetAllAsync(ct);
        var qr = all.FirstOrDefault(q => q.Id == id);
        if (qr is null) return NotFound();

        qr.IsActive = request.IsActive;
        if (!request.IsActive)
        {
            qr.DeactivatedAt = DateTime.UtcNow;
            qr.DeactivatedById = actorId;
        }
        if (!string.IsNullOrWhiteSpace(request.Label))
            qr.Label = request.Label;

        await _qrCodes.SaveChangesAsync(ct);
        return Ok();
    }
}

public record CreateQrRequest(
    string Code,
    string QrType,
    string Label,
    string? FactoryId = null,
    string? SectionId = null,
    string? LineId = null,
    string? MachineId = null
);

public record UpdateQrRequest(bool IsActive, string? Label = null);
