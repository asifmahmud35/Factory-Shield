using FactoryShield.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FactoryShield.Infrastructure.Persistence.Configurations;

public class OfflineDraftConfiguration : IEntityTypeConfiguration<OfflineDraft>
{
    public void Configure(EntityTypeBuilder<OfflineDraft> builder)
    {
        builder.ToTable("OfflineDrafts");
        builder.HasKey(d => d.Id);

        builder.Property(d => d.LocalDraftId).IsRequired().HasMaxLength(100);
        builder.HasIndex(d => d.LocalDraftId).IsUnique();

        builder.Property(d => d.PayloadHash).IsRequired().HasMaxLength(64);
        builder.Property(d => d.PayloadJson).IsRequired();
        builder.Property(d => d.SyncStatus).IsRequired().HasMaxLength(20).HasDefaultValue("Queued");
        builder.Property(d => d.SyncAttemptCount).HasDefaultValue(0);
        builder.Property(d => d.AlertSentCount).HasDefaultValue(0);
        builder.Property(d => d.LocalEventTime).IsRequired();

        // Unique constraint for deduplication: one incident per reporter + content hash
        builder.HasIndex(d => new { d.ReporterId, d.PayloadHash }).IsUnique();

        builder.HasOne(d => d.Reporter)
            .WithMany()
            .HasForeignKey(d => d.ReporterId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
