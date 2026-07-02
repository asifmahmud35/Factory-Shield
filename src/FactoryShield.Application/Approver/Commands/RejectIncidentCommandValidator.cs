using FluentValidation;

namespace FactoryShield.Application.Approver.Commands;

public class RejectIncidentCommandValidator : AbstractValidator<RejectIncidentCommand>
{
    public RejectIncidentCommandValidator()
    {
        // architecture.md §4.5: reject-type reasons require >= 10 chars (applied to both
        // soft and hard reject here — MVP has no separate REQUEST_CHANGES action).
        RuleFor(x => x.Reason)
            .NotEmpty()
            .MinimumLength(10)
            .WithMessage("Reject reason must be at least 10 characters.");
    }
}
