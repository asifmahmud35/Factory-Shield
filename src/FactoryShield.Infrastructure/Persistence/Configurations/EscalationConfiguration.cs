using FactoryShield.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FactoryShield.Infrastructure.Persistence.Configurations;

public class EscalationConfiguration : IEntityTypeConfiguration<Escalation>
{
    public void Configure(EntityTypeBuilder<Escalation> builder)
    {
        builder.ToTable("Escalations");
        builder.HasKey(e => e.Id);
        builder.Property(e => e.EscalationType).IsRequired().HasMaxLength(20);
        builder.Property(e => e.Reason).HasMaxLength(1000);
        builder.Property(e => e.FallbackNotifiedRole).HasMaxLength(50);
        builder.Property(e => e.Resolution).IsRequired().HasMaxLength(20).HasDefaultValue("OPEN");
        builder.HasOne(e => e.Incident)
               .WithMany()
               .HasForeignKey(e => e.IncidentId)
               .OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(e => e.EscalatedTo)
               .WithMany()
               .HasForeignKey(e => e.EscalatedToId)
               .OnDelete(DeleteBehavior.SetNull);
        builder.HasIndex(e => e.IncidentId);
    }
}
