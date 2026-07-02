namespace FactoryShield.Domain.Entities;

public class Role
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
    /// <summary>JSON array of permission codes.</summary>
    public string PermissionsJson { get; set; } = "[]";
}
