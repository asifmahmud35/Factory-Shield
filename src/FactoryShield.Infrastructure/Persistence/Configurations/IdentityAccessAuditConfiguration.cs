using FactoryShield.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FactoryShield.Infrastructure.Persistence.Configurations;

public class IdentityAccessAuditConfiguration : IEntityTypeConfiguration<IdentityAccessAudit>
{
    public void Configure(EntityTypeBuilder<IdentityAccessAudit> builder)
    {
        builder.ToTable("IdentityAccessAudits");
        builder.HasKey(a => a.Id);

        builder.Property(a => a.AccessedByRole).IsRequired().HasMaxLength(50);
        builder.Property(a => a.Reason).HasMaxLength(500);
        builder.Property(a => a.AccessedAt).IsRequired();

        builder.HasOne(a => a.Incident)
            .WithMany()
            .HasForeignKey(a => a.IncidentId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(a => a.AccessedBy)
            .WithMany()
            .HasForeignKey(a => a.AccessedById)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(a => new { a.IncidentId, a.AccessedAt });
    }
}
