namespace FactoryShield.Domain.Entities;

public class Department
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Manager { get; set; }
    public string? Location { get; set; }
    public bool Active { get; set; } = true;
}
