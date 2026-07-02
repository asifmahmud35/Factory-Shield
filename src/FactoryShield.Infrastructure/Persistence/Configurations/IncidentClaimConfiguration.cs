using FactoryShield.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FactoryShield.Infrastructure.Persistence.Configurations;

public class IncidentClaimConfiguration : IEntityTypeConfiguration<IncidentClaim>
{
    public void Configure(EntityTypeBuilder<IncidentClaim> builder)
    {
        builder.ToTable("IncidentClaims");
        builder.HasKey(c => c.Id);

        builder.Property(c => c.ClaimedAt).IsRequired();
        builder.Property(c => c.ExpiresAt).IsRequired();
        builder.Property(c => c.IsActive).IsRequired().HasDefaultValue(true);

        builder.HasOne(c => c.Incident)
            .WithMany()
            .HasForeignKey(c => c.IncidentId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(c => c.ClaimedBy)
            .WithMany()
            .HasForeignKey(c => c.ClaimedById)
            .OnDelete(DeleteBehavior.Restrict);

        // Only one active claim per incident at a time
        builder.HasIndex(c => new { c.IncidentId, c.IsActive })
            .HasFilter("\"IsActive\" = true")
            .IsUnique();
    }
}
