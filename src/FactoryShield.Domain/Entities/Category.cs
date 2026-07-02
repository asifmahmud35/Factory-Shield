namespace FactoryShield.Domain.Entities;

public class Category
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public bool Active { get; set; } = true;
    /// <summary>JSON array of subcategory names.</summary>
    public string SubcategoriesJson { get; set; } = "[]";
}
