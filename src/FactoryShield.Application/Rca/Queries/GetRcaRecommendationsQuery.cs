using FactoryShield.Application.Common.Interfaces;
using FactoryShield.Application.Rca.Models;
using MediatR;

namespace FactoryShield.Application.Rca.Queries;

public record GetRcaRecommendationsQuery(Guid IncidentId) : IRequest<RcaRecommendationsDto>;

public class GetRcaRecommendationsQueryHandler : IRequestHandler<GetRcaRecommendationsQuery, RcaRecommendationsDto>
{
    private readonly IInvestigationRepository _investigations;
    private readonly IIncidentRepository _incidents;

    public GetRcaRecommendationsQueryHandler(
        IInvestigationRepository investigations,
        IIncidentRepository incidents)
    {
        _investigations = investigations;
        _incidents = incidents;
    }

    public async Task<RcaRecommendationsDto> Handle(GetRcaRecommendationsQuery request, CancellationToken ct)
    {
        var inv = await _investigations.FindByIncidentIdAsync(request.IncidentId, ct)
            ?? throw new KeyNotFoundException($"No investigation found for incident {request.IncidentId}.");

        var incident = inv.Incident
            ?? await _incidents.FindByIdAsync(request.IncidentId, ct)
            ?? throw new KeyNotFoundException($"Incident {request.IncidentId} not found.");

        var category = incident.Category ?? "Incident";
        var description = incident.ShortDescription ?? category;
        var factory = incident.Factory ?? "the facility";
        var equipment = incident.Equipment;

        var problem = inv.ProblemStatement?.Trim();
        if (string.IsNullOrWhiteSpace(problem))
            problem = $"{category} reported at {factory}: {description}.";

        var whys = BuildWhyChain(category, equipment, factory);
        var structured = BuildStructuredRootCause(category, equipment);
        var fishbone = BuildFishbone(category, equipment);

        return new RcaRecommendationsDto(
            problem,
            whys,
            structured,
            MapStructuredCategory(category),
            fishbone,
            ["physical", "human", "system", "contributing"]);
    }

    private static string MapStructuredCategory(string category) => category.ToLowerInvariant() switch
    {
        "injury" or "slip/fall" or "near miss" => "Human Error",
        "equipment" or "fire safety" => "Equipment / Machine",
        "chemical" or "environmental" => "Environment",
        "quality" => "Process / Procedure",
        _ => "Management / Supervision"
    };

    private static List<string> BuildWhyChain(string category, string? equipment, string factory)
    {
        var machine = string.IsNullOrWhiteSpace(equipment) ? "the equipment involved" : equipment;
        return category.ToLowerInvariant() switch
        {
            "injury" or "slip/fall" =>
            [
                "The operator sustained an injury during normal work activity.",
                "Required safety controls were not effective at the point of contact.",
                "A guard, procedure, or PPE requirement was missing or not followed.",
                "Training or supervision did not ensure safe work practices.",
                "Management systems did not detect the hazard before the incident."
            ],
            "equipment" =>
            [
                $"Production was interrupted due to a fault on {machine}.",
                "The machine was operated without adequate preventive maintenance.",
                "A component failed or a safety interlock was bypassed.",
                "Maintenance scheduling did not address the failure mode.",
                "Asset management did not enforce inspection and repair standards."
            ],
            _ =>
            [
                $"An unsafe condition was observed at {factory}.",
                "Existing controls did not prevent exposure to the hazard.",
                "Work methods or layout increased the likelihood of recurrence.",
                "Supervision did not correct the unsafe condition promptly.",
                "Management review did not close the systemic gap."
            ]
        };
    }

    private static string BuildStructuredRootCause(string category, string? equipment)
    {
        var machine = string.IsNullOrWhiteSpace(equipment) ? "affected equipment" : equipment;
        return category.ToLowerInvariant() switch
        {
            "injury" => "Inadequate guarding and insufficient operator training allowed contact with a hazardous energy source.",
            "equipment" => $"Preventive maintenance and inspection routines did not prevent failure of {machine}.",
            "chemical" => "Chemical handling controls and spill response preparedness were insufficient for the task.",
            "quality" => "Process parameters and in-process checks did not detect the defect before release.",
            _ => "Systemic gaps in hazard identification, training, and supervision allowed the incident to occur."
        };
    }

    private static FishboneCategoriesDto BuildFishbone(string category, string? equipment)
    {
        var machine = string.IsNullOrWhiteSpace(equipment) ? "Unmaintained equipment" : $"Fault on {equipment}";
        return category.ToLowerInvariant() switch
        {
            "injury" => new FishboneCategoriesDto(
                "Operator fatigue or distraction",
                "Missing or damaged machine guard",
                "SOP not followed during task changeover",
                "Incorrect material handling",
                "Poor lighting or slippery floor",
                "Insufficient safety briefing"),
            "equipment" => new FishboneCategoriesDto(
                "Operator skipped pre-start check",
                machine,
                "No lockout/tagout applied",
                "Wrong spare part installed",
                "Dust/heat affecting performance",
                "Deferred maintenance backlog"),
            _ => new FishboneCategoriesDto(
                "Insufficient training",
                "Equipment not fit for use",
                "Procedure not available at point of use",
                "Material out of specification",
                "Congested or unsafe workspace",
                "Production pressure over safety")
        };
    }
}
