using FactoryShield.Application.Common.Interfaces;
using Microsoft.Extensions.Logging;

namespace FactoryShield.Infrastructure.Services;

/// <summary>Development stub — logs email to console. Swap for SendGrid in production.</summary>
public class DevEmailService : IEmailService
{
    private readonly ILogger<DevEmailService> _logger;

    public DevEmailService(ILogger<DevEmailService> logger) => _logger = logger;

    public Task SendAsync(EmailMessage message, CancellationToken ct = default)
    {
        _logger.LogInformation(
            "[DEV EMAIL] To: {To} | Subject: {Subject} | Body: {Body}",
            message.To, message.Subject, message.Body);
        return Task.CompletedTask;
    }
}
