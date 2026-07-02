using FactoryShield.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FactoryShield.Infrastructure.Persistence.Configurations;

public class InvestigationTimelineEventConfiguration : IEntityTypeConfiguration<InvestigationTimelineEvent>
{
    public void Configure(EntityTypeBuilder<InvestigationTimelineEvent> builder)
    {
        builder.ToTable("InvestigationTimelineEvents");
        builder.HasKey(i => i.Id);

        builder.HasOne(i => i.Investigation)
            .WithMany(inv => inv.TimelineEvents)
            .HasForeignKey(i => i.InvestigationId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Property(i => i.EventType).IsRequired().HasMaxLength(100);
        builder.Property(i => i.Description).IsRequired().HasMaxLength(1000);
        builder.Property(i => i.OccurredAt).IsRequired();
    }
}
