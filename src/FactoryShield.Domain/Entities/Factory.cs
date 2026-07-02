namespace FactoryShield.Domain.Entities;

public class Factory
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Location { get; set; }
    public bool Active { get; set; } = true;
    public ICollection<ProductionLine> Lines { get; set; } = [];
}
