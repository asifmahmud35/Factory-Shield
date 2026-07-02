using FactoryShield.Application.Auth.Models;
using MediatR;

namespace FactoryShield.Application.Auth.Commands;

public record LoginCommand(string Email, string Password) : IRequest<LoginResult?>;
