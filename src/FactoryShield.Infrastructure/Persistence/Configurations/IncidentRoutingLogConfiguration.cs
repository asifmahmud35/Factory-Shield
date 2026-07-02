using FactoryShield.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FactoryShield.Infrastructure.Persistence.Configurations;

public class IncidentRoutingLogConfiguration : IEntityTypeConfiguration<IncidentRoutingLog>
{
    public void Configure(EntityTypeBuilder<IncidentRoutingLog> builder)
    {
        builder.ToTable("IncidentRoutingLogs");
        builder.HasKey(r => r.Id);

        builder.Property(r => r.PreviousCategory).IsRequired().HasMaxLength(100);
        builder.Property(r => r.NewCategory).IsRequired().HasMaxLength(100);
        builder.Property(r => r.PreviousSeverity).IsRequired();
        builder.Property(r => r.NewSeverity).IsRequired();
        builder.Property(r => r.Reason).HasMaxLength(1000);
        builder.Property(r => r.ChangedAt).IsRequired();

        builder.HasOne(r => r.Incident)
            .WithMany()
            .HasForeignKey(r => r.IncidentId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(r => r.ChangedBy)
            .WithMany()
            .HasForeignKey(r => r.ChangedById)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
