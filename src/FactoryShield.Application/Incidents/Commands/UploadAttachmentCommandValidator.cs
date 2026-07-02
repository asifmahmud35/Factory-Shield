using FluentValidation;

namespace FactoryShield.Application.Incidents.Commands;

public class UploadAttachmentCommandValidator : AbstractValidator<UploadAttachmentCommand>
{
    private const long MaxBytes = 5 * 1024 * 1024;

    private static readonly HashSet<string> Allowed =
        new(StringComparer.OrdinalIgnoreCase) { "image/jpeg", "image/png", "application/pdf" };

    public UploadAttachmentCommandValidator()
    {
        RuleFor(x => x.MimeType)
            .Must(m => Allowed.Contains(m))
            .WithMessage("Only JPEG, PNG, and PDF files are allowed.");

        RuleFor(x => x.FileSizeBytes)
            .LessThanOrEqualTo(MaxBytes)
            .WithMessage("File must not exceed 5 MB.");
    }
}
