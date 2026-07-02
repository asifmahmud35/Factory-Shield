using FluentValidation;

namespace FactoryShield.Application.Incidents.Commands;

public class CreateIncidentCommandValidator : AbstractValidator<CreateIncidentCommand>
{
    public CreateIncidentCommandValidator()
    {
        RuleFor(x => x.Category).NotEmpty().MaximumLength(100);
        RuleFor(x => x.ShortDescription).NotEmpty().MaximumLength(500);
        RuleFor(x => x.Severity).InclusiveBetween(1, 4).When(x => x.Severity.HasValue);
        RuleFor(x => x.Department).MaximumLength(200).When(x => x.Department is not null);

        When(x => x.ReportFields is not null, () =>
        {
            RuleFor(x => x.ReportFields!.ClassificationCategory).MaximumLength(100);
            RuleFor(x => x.ReportFields!.SubCategory).MaximumLength(100);
            RuleFor(x => x.ReportFields!.Factory).MaximumLength(100);
            RuleFor(x => x.ReportFields!.Building).MaximumLength(100);
            RuleFor(x => x.ReportFields!.Floor).MaximumLength(50);
            RuleFor(x => x.ReportFields!.Equipment).MaximumLength(100);
            RuleFor(x => x.ReportFields!.ProductionOrder).MaximumLength(100);
            RuleFor(x => x.ReportFields!.Buyer).MaximumLength(100);
            RuleFor(x => x.ReportFields!.StyleNumber).MaximumLength(100);
            RuleFor(x => x.ReportFields!.ReporterName).MaximumLength(200);
            RuleFor(x => x.ReportFields!.EmployeeId).MaximumLength(50);
            RuleFor(x => x.ReportFields!.ReporterDepartment).MaximumLength(100);
            RuleFor(x => x.ReportFields!.ContactNumber).MaximumLength(50);
            RuleFor(x => x.ReportFields!.Witnesses).MaximumLength(500);
            RuleFor(x => x.ReportFields!.ImmediateActionTaken).MaximumLength(500);
            RuleFor(x => x.ReportFields!.ExactLocation).MaximumLength(500);
            RuleFor(x => x.ReportFields!.GpsCoordinates).MaximumLength(100);
            RuleFor(x => x.ReportFields!.AiSummary).MaximumLength(2000);
        });
    }
}
