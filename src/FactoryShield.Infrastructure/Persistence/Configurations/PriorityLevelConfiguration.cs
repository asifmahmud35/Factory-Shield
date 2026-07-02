using FactoryShield.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FactoryShield.Infrastructure.Persistence.Configurations;

public class PriorityLevelConfiguration : IEntityTypeConfiguration<PriorityLevel>
{
    public void Configure(EntityTypeBuilder<PriorityLevel> builder)
    {
        builder.ToTable("PriorityLevels");
        builder.HasKey(p => p.Id);
        builder.Property(p => p.Code).IsRequired().HasMaxLength(20);
        builder.HasIndex(p => p.Code).IsUnique();
        builder.Property(p => p.Label).IsRequired().HasMaxLength(100);
        builder.Property(p => p.Color).HasMaxLength(20);
        builder.HasIndex(p => p.PriorityValue).IsUnique();
    }
}
