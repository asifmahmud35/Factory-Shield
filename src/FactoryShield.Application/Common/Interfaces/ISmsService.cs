namespace FactoryShield.Application.Common.Interfaces;

public interface ISmsService
{
    /// <summary>SMS body must be ≤ 160 chars per spec.</summary>
    Task SendAsync(string toPhoneNumber, string body, CancellationToken ct = default);
}
