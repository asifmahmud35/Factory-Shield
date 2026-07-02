using System.Text.Json;
using FactoryShield.Application.Common.Interfaces;
using FactoryShield.Application.Rca.Models;
using MediatR;

namespace FactoryShield.Application.Rca.Commands;

public record SaveRcaCommand(
    Guid IncidentId,
    string? Method,
    string? ProblemStatement,
    IReadOnlyList<WhyEntryDto>? WhyEntries,
    FishboneCategoriesDto? FishboneCategories,
    string? StructuredCategory,
    string? StructuredDescription,
    string? StructuredContributing,
    string? StructuredVerification,
    string? StructuredLessons,
    string? RootCauseStatement,
    IReadOnlyList<string>? ChecklistCompleted
) : IRequest;

public class SaveRcaCommandHandler : IRequestHandler<SaveRcaCommand>
{
    private static readonly JsonSerializerOptions JsonOpts = new() { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };

    private readonly IInvestigationRepository _investigations;

    public SaveRcaCommandHandler(IInvestigationRepository investigations) => _investigations = investigations;

    public async Task Handle(SaveRcaCommand request, CancellationToken cancellationToken)
    {
        var inv = await _investigations.FindByIncidentIdAsync(request.IncidentId, cancellationToken)
            ?? throw new KeyNotFoundException($"No investigation found for incident {request.IncidentId}.");

        if (inv.RcaStatus == "Submitted")
            throw new InvalidOperationException("RCA has already been submitted and cannot be edited.");

        if (request.Method is not null) inv.RcaMethod = request.Method;
        if (request.ProblemStatement is not null) inv.ProblemStatement = request.ProblemStatement;
        if (request.StructuredCategory is not null) inv.StructuredCategory = request.StructuredCategory;
        if (request.StructuredContributing is not null) inv.Notes = request.StructuredContributing;
        if (request.StructuredVerification is not null) inv.FindingsSummary = request.StructuredVerification;
        if (request.StructuredLessons is not null) inv.LessonsLearned = request.StructuredLessons;

        var rootCause = ResolveRootCause(request);
        if (!string.IsNullOrWhiteSpace(rootCause))
            inv.RootCauseDescription = rootCause;

        if (request.WhyEntries is not null)
            inv.WhyEntriesJson = JsonSerializer.Serialize(request.WhyEntries, JsonOpts);

        if (request.FishboneCategories is not null)
        {
            var fishbone = new Dictionary<string, string>
            {
                ["man"] = request.FishboneCategories.Man,
                ["machine"] = request.FishboneCategories.Machine,
                ["method"] = request.FishboneCategories.Method,
                ["material"] = request.FishboneCategories.Material,
                ["environment"] = request.FishboneCategories.Environment,
                ["management"] = request.FishboneCategories.Management
            };
            inv.FishboneJson = JsonSerializer.Serialize(fishbone, JsonOpts);
        }

        if (request.ChecklistCompleted is not null)
            inv.RcaChecklistJson = JsonSerializer.Serialize(request.ChecklistCompleted, JsonOpts);

        if (request.Method is not null)
            inv.RootCauseCode = request.Method.ToUpperInvariant();

        inv.UpdatedAt = DateTime.UtcNow;
        await _investigations.SaveChangesAsync(cancellationToken);
    }

    private static string? ResolveRootCause(SaveRcaCommand request)
    {
        if (!string.IsNullOrWhiteSpace(request.RootCauseStatement))
            return request.RootCauseStatement.Trim();

        if (!string.IsNullOrWhiteSpace(request.StructuredDescription))
            return request.StructuredDescription.Trim();

        if (request.WhyEntries is { Count: > 0 })
        {
            var last = request.WhyEntries
                .OrderBy(w => w.Order)
                .Select(w => w.Text?.Trim())
                .LastOrDefault(t => !string.IsNullOrWhiteSpace(t));
            if (!string.IsNullOrWhiteSpace(last))
                return last;
        }

        if (request.FishboneCategories is not null)
        {
            var causes = new[]
            {
                request.FishboneCategories.Man,
                request.FishboneCategories.Machine,
                request.FishboneCategories.Method,
                request.FishboneCategories.Material,
                request.FishboneCategories.Environment,
                request.FishboneCategories.Management
            }.SelectMany(c => (c ?? "").Split('\n', StringSplitOptions.RemoveEmptyEntries))
             .Select(c => c.Trim())
             .Where(c => c.Length > 0)
             .ToList();

            if (causes.Count > 0)
                return string.Join("; ", causes.Take(3));
        }

        return null;
    }
}
