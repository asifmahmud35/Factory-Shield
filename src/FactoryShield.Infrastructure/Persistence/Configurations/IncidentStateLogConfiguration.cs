using FactoryShield.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FactoryShield.Infrastructure.Persistence.Configurations;

public class IncidentStateLogConfiguration : IEntityTypeConfiguration<IncidentStateLog>
{
    public void Configure(EntityTypeBuilder<IncidentStateLog> builder)
    {
        builder.ToTable("IncidentStateLogs");
        builder.HasKey(l => l.Id);

        builder.Property(l => l.EventType).IsRequired().HasMaxLength(50);
        builder.Property(l => l.FromStatus).HasMaxLength(50);
        builder.Property(l => l.ToStatus).HasMaxLength(50);
        builder.Property(l => l.ActorRole).HasMaxLength(50);
        builder.Property(l => l.Description).HasMaxLength(500);
        builder.Property(l => l.PreviousValue).HasMaxLength(200);
        builder.Property(l => l.NewValue).HasMaxLength(200);
        builder.Property(l => l.VisibilityScope).IsRequired().HasMaxLength(20).HasDefaultValue("INTERNAL");
        builder.Property(l => l.CreatedAt).IsRequired();

        builder.HasOne(l => l.Incident)
            .WithMany()
            .HasForeignKey(l => l.IncidentId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(l => l.Actor)
            .WithMany()
            .HasForeignKey(l => l.ActorId)
            .OnDelete(DeleteBehavior.SetNull)
            .IsRequired(false);

        builder.HasIndex(l => new { l.IncidentId, l.CreatedAt });
    }
}
