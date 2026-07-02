using FactoryShield.Application.Auth.Models;
using FactoryShield.Application.Common.Interfaces;
using MediatR;

namespace FactoryShield.Application.Auth.Commands;

public class LoginCommandHandler : IRequestHandler<LoginCommand, LoginResult?>
{
    private readonly IUserRepository _users;
    private readonly IPasswordVerifier _passwordVerifier;
    private readonly IJwtService _jwt;

    public LoginCommandHandler(IUserRepository users, IPasswordVerifier passwordVerifier, IJwtService jwt)
    {
        _users = users;
        _passwordVerifier = passwordVerifier;
        _jwt = jwt;
    }

    public async Task<LoginResult?> Handle(LoginCommand request, CancellationToken cancellationToken)
    {
        var user = await _users.FindByEmailWithRoleAsync(request.Email, cancellationToken);
        if (user is null) return null;

        if (!_passwordVerifier.Verify(user.PasswordHash, request.Password)) return null;

        var token = _jwt.GenerateToken(user.Id, user.Email, user.Role.Code);
        return new LoginResult(token, user.Role.Code);
    }
}
