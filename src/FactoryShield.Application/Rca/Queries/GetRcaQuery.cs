using System.Text.Json;
using FactoryShield.Application.Common.Interfaces;
using FactoryShield.Application.Rca.Models;
using MediatR;

namespace FactoryShield.Application.Rca.Queries;

public record GetRcaQuery(Guid IncidentId) : IRequest<RcaDto>;

public class GetRcaQueryHandler : IRequestHandler<GetRcaQuery, RcaDto>
{
    private static readonly JsonSerializerOptions JsonOpts = new() { PropertyNameCaseInsensitive = true };

    private readonly IInvestigationRepository _investigations;

    public GetRcaQueryHandler(IInvestigationRepository investigations) => _investigations = investigations;

    public async Task<RcaDto> Handle(GetRcaQuery request, CancellationToken cancellationToken)
    {
        var inv = await _investigations.FindByIncidentIdAsync(request.IncidentId, cancellationToken)
            ?? throw new KeyNotFoundException($"No investigation found for incident {request.IncidentId}.");

        var whyEntries = ParseWhyEntries(inv.WhyEntriesJson);
        var fishbone = ParseFishbone(inv.FishboneJson);
        var checklistCompleted = ParseChecklist(inv.RcaChecklistJson);

        return new RcaDto(
            inv.IncidentId,
            inv.Incident?.IncidentReference ?? string.Empty,
            inv.RcaMethod,
            inv.ProblemStatement,
            whyEntries,
            fishbone,
            inv.StructuredCategory,
            inv.RootCauseDescription,
            inv.Notes,
            inv.FindingsSummary,
            inv.LessonsLearned,
            inv.RootCauseDescription,
            checklistCompleted,
            inv.RcaStatus,
            inv.RcaSubmittedAt
        );
    }

    internal static List<WhyEntryDto> ParseWhyEntries(string? json)
    {
        if (string.IsNullOrWhiteSpace(json)) return [];
        try
        {
            return JsonSerializer.Deserialize<List<WhyEntryDto>>(json, JsonOpts) ?? [];
        }
        catch
        {
            return [];
        }
    }

    internal static List<string> ParseChecklist(string? json)
    {
        if (string.IsNullOrWhiteSpace(json)) return [];
        try
        {
            return JsonSerializer.Deserialize<List<string>>(json, JsonOpts) ?? [];
        }
        catch
        {
            return [];
        }
    }

    internal static FishboneCategoriesDto ParseFishbone(string? json)
    {
        if (string.IsNullOrWhiteSpace(json))
            return new FishboneCategoriesDto("", "", "", "", "", "");

        try
        {
            var dict = JsonSerializer.Deserialize<Dictionary<string, string>>(json, JsonOpts)
                       ?? new Dictionary<string, string>();
            return new FishboneCategoriesDto(
                dict.GetValueOrDefault("man", ""),
                dict.GetValueOrDefault("machine", ""),
                dict.GetValueOrDefault("method", ""),
                dict.GetValueOrDefault("material", ""),
                dict.GetValueOrDefault("environment", ""),
                dict.GetValueOrDefault("management", "")
            );
        }
        catch
        {
            return new FishboneCategoriesDto("", "", "", "", "", "");
        }
    }
}
