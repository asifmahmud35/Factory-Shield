namespace FactoryShield.Application.Common.Interfaces;

public interface IPasswordVerifier
{
    string Hash(string plainPassword);
    bool Verify(string hashedPassword, string plainPassword);
}
