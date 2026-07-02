using FactoryShield.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FactoryShield.Infrastructure.Persistence.Configurations;

public class NotificationConfiguration : IEntityTypeConfiguration<Notification>
{
    public void Configure(EntityTypeBuilder<Notification> builder)
    {
        builder.ToTable("Notifications");
        builder.HasKey(n => n.Id);
        builder.Property(n => n.Type).IsRequired().HasMaxLength(50);
        builder.Property(n => n.Stage).IsRequired().HasMaxLength(50);
        builder.Property(n => n.DeliveryStatus).IsRequired().HasMaxLength(20).HasDefaultValue("Pending");

        // IncidentId is nullable — system-level alerts (QR anomaly, stale draft) have no incident
        builder.Property(n => n.IncidentId).IsRequired(false);
        builder.HasOne(n => n.Incident)
               .WithMany()
               .HasForeignKey(n => n.IncidentId)
               .IsRequired(false)
               .OnDelete(DeleteBehavior.SetNull);

        // Dispatch fields
        builder.Property(n => n.RecipientRole).HasMaxLength(50);
        builder.Property(n => n.Channel).HasMaxLength(20);
        builder.Property(n => n.Subject).HasMaxLength(200);
        builder.Property(n => n.Body).HasMaxLength(2000);
        builder.Property(n => n.DeepLinkPath).HasMaxLength(500);
        builder.Property(n => n.TriggerEvent).HasMaxLength(100);
        builder.Property(n => n.IdempotencyKey).HasMaxLength(200);

        // Idempotency index for dedup
        builder.HasIndex(n => n.IdempotencyKey)
               .IsUnique()
               .HasFilter("\"IdempotencyKey\" IS NOT NULL");

        // Recipient query index
        builder.HasIndex(n => n.RecipientId);
        builder.HasIndex(n => new { n.RecipientId, n.IsRead });

        // Duplicate SLA notification guard (legacy unique index — NULLs excluded by Postgres)
        builder.HasIndex(n => new { n.IncidentId, n.Stage, n.Type }).IsUnique();
    }
}
