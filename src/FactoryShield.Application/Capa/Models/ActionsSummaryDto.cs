namespace FactoryShield.Application.Capa.Models;

public record ActionsSummaryDto(
    int TotalActions,
    int InProgress,
    int Open,
    int Completed,
    int OverallPercentage
);
