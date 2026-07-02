namespace FactoryShield.Application.Rca.Models;

public record WhyEntryDto(int Order, string Text);

public record FishboneCategoriesDto(
    string Man,
    string Machine,
    string Method,
    string Material,
    string Environment,
    string Management
);

public record RcaDto(
    Guid IncidentId,
    string IncidentReference,
    string? Method,
    string? ProblemStatement,
    IReadOnlyList<WhyEntryDto> WhyEntries,
    FishboneCategoriesDto FishboneCategories,
    string? StructuredCategory,
    string? StructuredDescription,
    string? StructuredContributing,
    string? StructuredVerification,
    string? StructuredLessons,
    string? RootCauseStatement,
    IReadOnlyList<string> ChecklistCompleted,
    string Status,
    DateTime? SubmittedAt
);

public record RcaRecommendationsDto(
    string ProblemStatement,
    IReadOnlyList<string> WhySuggestions,
    string StructuredDescription,
    string StructuredCategory,
    FishboneCategoriesDto FishboneSuggestions,
    IReadOnlyList<string> ChecklistToComplete
);

public record SimilarIncidentDto(
    string IncidentReference,
    string Title,
    string Category,
    DateTime CreatedAt,
    int MatchPercent
);
