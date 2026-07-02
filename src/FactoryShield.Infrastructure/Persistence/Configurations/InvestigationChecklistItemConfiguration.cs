using FactoryShield.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FactoryShield.Infrastructure.Persistence.Configurations;

public class InvestigationChecklistItemConfiguration : IEntityTypeConfiguration<InvestigationChecklistItem>
{
    public void Configure(EntityTypeBuilder<InvestigationChecklistItem> builder)
    {
        builder.ToTable("InvestigationChecklistItems");
        builder.HasKey(i => i.Id);

        builder.HasOne(i => i.Investigation)
            .WithMany(inv => inv.ChecklistItems)
            .HasForeignKey(i => i.InvestigationId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Property(i => i.Label).IsRequired().HasMaxLength(200);
        builder.Property(i => i.SortOrder).IsRequired();
    }
}
