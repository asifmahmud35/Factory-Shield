namespace FactoryShield.Application.Common.Interfaces;

public record EmailMessage(
    string To,
    string Subject,
    string Body,
    string? DeepLinkUrl = null
);

public interface IEmailService
{
    Task SendAsync(EmailMessage message, CancellationToken ct = default);
}
