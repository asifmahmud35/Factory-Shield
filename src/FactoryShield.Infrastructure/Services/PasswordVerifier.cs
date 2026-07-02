using FactoryShield.Application.Common.Interfaces;
using FactoryShield.Domain.Entities;
using Microsoft.AspNetCore.Identity;

namespace FactoryShield.Infrastructure.Services;

public class PasswordVerifier : IPasswordVerifier
{
    private readonly PasswordHasher<User> _hasher = new();

    public string Hash(string plainPassword) =>
        _hasher.HashPassword(new User(), plainPassword);

    public bool Verify(string hashedPassword, string plainPassword)
    {
        var result = _hasher.VerifyHashedPassword(new User(), hashedPassword, plainPassword);
        return result != PasswordVerificationResult.Failed;
    }
}
