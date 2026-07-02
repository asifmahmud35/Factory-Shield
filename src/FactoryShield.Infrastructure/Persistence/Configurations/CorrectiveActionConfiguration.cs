using FactoryShield.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FactoryShield.Infrastructure.Persistence.Configurations;

public class CorrectiveActionConfiguration : IEntityTypeConfiguration<CorrectiveAction>
{
    public void Configure(EntityTypeBuilder<CorrectiveAction> builder)
    {
        builder.ToTable("CorrectiveActions");
        builder.HasKey(c => c.Id);

        builder.HasOne(c => c.Incident)
            .WithMany()
            .HasForeignKey(c => c.IncidentId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Property(c => c.Title).IsRequired().HasMaxLength(200);
        builder.Property(c => c.Description).HasMaxLength(2000);
        builder.Property(c => c.Owner).HasMaxLength(200);
        builder.Property(c => c.Status).IsRequired().HasMaxLength(50);
        builder.Property(c => c.VerifiedBy).HasMaxLength(200);
        builder.Property(c => c.Priority).IsRequired();
        builder.Property(c => c.CompletionPercentage).IsRequired();
        builder.Property(c => c.CreatedAt).IsRequired();
    }
}
