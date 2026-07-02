using FactoryShield.Application.Common.Interfaces;
using Microsoft.Extensions.Logging;

namespace FactoryShield.Infrastructure.Services;

/// <summary>Development stub — logs SMS to console. Interface is Twilio-compatible for production swap.</summary>
public class DevSmsService : ISmsService
{
    private readonly ILogger<DevSmsService> _logger;

    public DevSmsService(ILogger<DevSmsService> logger) => _logger = logger;

    public Task SendAsync(string toPhoneNumber, string body, CancellationToken ct = default)
    {
        _logger.LogInformation("[DEV SMS] To: {Phone} | Body ({Len} chars): {Body}",
            toPhoneNumber, body.Length, body);
        return Task.CompletedTask;
    }
}
