using FactoryShield.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FactoryShield.Infrastructure.Persistence.Configurations;

public class ProductionLineConfiguration : IEntityTypeConfiguration<ProductionLine>
{
    public void Configure(EntityTypeBuilder<ProductionLine> builder)
    {
        builder.ToTable("ProductionLines");
        builder.HasKey(l => l.Id);
        builder.Property(l => l.Name).IsRequired().HasMaxLength(200);
        builder.HasOne(l => l.Factory)
            .WithMany(f => f.Lines)
            .HasForeignKey(l => l.FactoryId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.HasIndex(l => new { l.FactoryId, l.Name }).IsUnique();
    }
}
