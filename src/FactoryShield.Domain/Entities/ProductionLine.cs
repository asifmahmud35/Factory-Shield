namespace FactoryShield.Domain.Entities;

public class ProductionLine
{
    public Guid Id { get; set; }
    public Guid FactoryId { get; set; }
    public Factory Factory { get; set; } = null!;
    public string Name { get; set; } = string.Empty;
    public bool Active { get; set; } = true;
}
