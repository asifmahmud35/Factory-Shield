using FactoryShield.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FactoryShield.Infrastructure.Persistence.Configurations;

public class SlaClockConfiguration : IEntityTypeConfiguration<SlaClock>
{
    public void Configure(EntityTypeBuilder<SlaClock> builder)
    {
        builder.ToTable("SlaClocks");
        builder.HasKey(c => c.Id);

        builder.HasOne(c => c.Incident)
            .WithMany()
            .HasForeignKey(c => c.IncidentId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Property(c => c.Stage).IsRequired().HasMaxLength(50);
        builder.Property(c => c.StartedAt).IsRequired();
        builder.Property(c => c.TargetMinutes).IsRequired();

        // Fast lookup of the running clock per incident.
        builder.HasIndex(c => new { c.IncidentId, c.StoppedAt });
    }
}
