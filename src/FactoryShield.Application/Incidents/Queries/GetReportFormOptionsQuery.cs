using FactoryShield.Application.Common.Interfaces;
using FactoryShield.Application.Incidents.Models;
using MediatR;
using System.Text.Json;

namespace FactoryShield.Application.Incidents.Queries;

public record GetReportFormOptionsQuery : IRequest<ReportFormOptionsDto>;

public class GetReportFormOptionsQueryHandler : IRequestHandler<GetReportFormOptionsQuery, ReportFormOptionsDto>
{
    private static readonly JsonSerializerOptions JsonOpts = new() { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };

    private static readonly string[] DefaultIncidentTypes =
    [
        "Injury", "Chemical", "Equipment", "Fire Safety", "Quality", "Slip/Fall", "Near Miss", "Environmental"
    ];

    private static readonly string[] DefaultBuildings = ["Building 1", "Building 2", "Building A", "Building B"];
    private static readonly string[] DefaultFloors = ["Floor 1", "Floor 2", "Floor 3"];

    private readonly IAdminRepository _admin;

    public GetReportFormOptionsQueryHandler(IAdminRepository admin) => _admin = admin;

    public async Task<ReportFormOptionsDto> Handle(GetReportFormOptionsQuery request, CancellationToken ct)
    {
        var categories = await _admin.GetCategoriesAsync(ct);
        var departments = await _admin.GetDepartmentsAsync(ct);
        var factories = await _admin.GetFactoriesAsync(ct);
        var severities = await _admin.GetSeverityLevelsAsync(ct);

        var categoryDtos = categories
            .Where(c => c.Active)
            .Select(c => new ReportFormCategoryOption(
                c.Name,
                ParseSubcategories(c.SubcategoriesJson)))
            .ToList();

        var factoryDtos = new List<ReportFormFactoryOption>();
        foreach (var factory in factories.Where(f => f.Active))
        {
            var lines = await _admin.GetLinesByFactoryIdAsync(factory.Id, ct);
            factoryDtos.Add(new ReportFormFactoryOption(
                factory.Id,
                factory.Name,
                factory.Location,
                lines.Where(l => l.Active).Select(l => l.Name).ToList()));
        }

        var reporterDepartments = departments
            .Where(d => d.Active)
            .Select(d => d.Name)
            .Distinct()
            .OrderBy(n => n)
            .ToList();

        var severityDtos = severities
            .Where(s => s.SeverityValue is >= 1 and <= 4)
            .OrderBy(s => s.SeverityValue)
            .Select(s => new ReportFormSeverityOption(s.SeverityValue, $"{s.Label} ({s.Code})"))
            .ToList();

        if (severityDtos.Count == 0)
        {
            severityDtos =
            [
                new ReportFormSeverityOption(1, "Critical (L1)"),
                new ReportFormSeverityOption(2, "High (L2)"),
                new ReportFormSeverityOption(3, "Medium (L3)"),
                new ReportFormSeverityOption(4, "Low (L4)"),
            ];
        }

        if (categoryDtos.Count == 0)
        {
            categoryDtos =
            [
                new ReportFormCategoryOption("Occupational Safety", ["Needle Injury", "Laceration", "Burn", "Slip & Fall"]),
                new ReportFormCategoryOption("Equipment / Machine", ["Guard Missing", "Machine Fault", "Maintenance Issue"]),
            ];
        }

        if (factoryDtos.Count == 0)
        {
            factoryDtos.Add(new ReportFormFactoryOption(Guid.Empty, "Factory A", null, ["Line 3", "Line 7"]));
        }

        if (reporterDepartments.Count == 0)
        {
            reporterDepartments = ["Sewing", "Cutting", "Finishing", "Quality", "Maintenance", "Warehouse"];
        }

        return new ReportFormOptionsDto(
            DefaultIncidentTypes,
            categoryDtos,
            factoryDtos,
            reporterDepartments,
            DefaultBuildings,
            DefaultFloors,
            severityDtos);
    }

    private static IReadOnlyList<string> ParseSubcategories(string? json)
    {
        if (string.IsNullOrWhiteSpace(json)) return [];
        try
        {
            return JsonSerializer.Deserialize<string[]>(json, JsonOpts) ?? [];
        }
        catch
        {
            return [];
        }
    }
}
