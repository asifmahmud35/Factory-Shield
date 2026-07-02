using FactoryShield.Application.Common.Interfaces;

namespace FactoryShield.Application.Jobs;

/// <summary>
/// Runs every 5 minutes. Deactivates any claims whose ExpiresAt has passed.
/// </summary>
public class ClaimReleaseJob
{
    private readonly IIncidentClaimRepository _claims;

    public ClaimReleaseJob(IIncidentClaimRepository claims) => _claims = claims;

    public async Task ExecuteAsync(CancellationToken ct = default)
    {
        var expired = await _claims.GetExpiredClaimsAsync(ct);
        foreach (var claim in expired)
            claim.IsActive = false;

        if (expired.Count > 0)
            await _claims.SaveChangesAsync(ct);
    }
}
