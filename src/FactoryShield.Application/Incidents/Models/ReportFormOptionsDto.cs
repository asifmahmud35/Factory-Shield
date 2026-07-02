namespace FactoryShield.Application.Incidents.Models;

public record ReportFormOptionsDto(
    IReadOnlyList<string> IncidentTypes,
    IReadOnlyList<ReportFormCategoryOption> Categories,
    IReadOnlyList<ReportFormFactoryOption> Factories,
    IReadOnlyList<string> ReporterDepartments,
    IReadOnlyList<string> Buildings,
    IReadOnlyList<string> Floors,
    IReadOnlyList<ReportFormSeverityOption> SeverityLevels
);

public record ReportFormCategoryOption(string Name, IReadOnlyList<string> Subcategories);

public record ReportFormFactoryOption(
    Guid Id,
    string Name,
    string? Location,
    IReadOnlyList<string> Lines
);

public record ReportFormSeverityOption(int Value, string Label);
