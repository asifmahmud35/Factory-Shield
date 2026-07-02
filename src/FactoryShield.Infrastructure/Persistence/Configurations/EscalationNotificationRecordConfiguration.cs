using FactoryShield.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FactoryShield.Infrastructure.Persistence.Configurations;

public class EscalationNotificationRecordConfiguration : IEntityTypeConfiguration<EscalationNotificationRecord>
{
    public void Configure(EntityTypeBuilder<EscalationNotificationRecord> builder)
    {
        builder.ToTable("EscalationNotificationRecords");
        builder.HasKey(n => n.Id);
        builder.Property(n => n.IncidentReference).IsRequired().HasMaxLength(50);
        builder.Property(n => n.RuleName).IsRequired().HasMaxLength(200);
        builder.Property(n => n.Via).IsRequired().HasMaxLength(50);
        builder.Property(n => n.Recipients).IsRequired().HasMaxLength(500);
        builder.Property(n => n.Status).IsRequired().HasMaxLength(50);
        builder.HasIndex(n => n.SentAt);
    }
}
