using FactoryShield.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FactoryShield.Infrastructure.Persistence.Configurations;

public class SeverityLevelConfiguration : IEntityTypeConfiguration<SeverityLevel>
{
    public void Configure(EntityTypeBuilder<SeverityLevel> builder)
    {
        builder.ToTable("SeverityLevels");
        builder.HasKey(s => s.Id);
        builder.Property(s => s.Code).IsRequired().HasMaxLength(20);
        builder.HasIndex(s => s.Code).IsUnique();
        builder.Property(s => s.Label).IsRequired().HasMaxLength(100);
        builder.Property(s => s.Color).HasMaxLength(20);
        builder.HasIndex(s => s.SeverityValue).IsUnique();
    }
}
