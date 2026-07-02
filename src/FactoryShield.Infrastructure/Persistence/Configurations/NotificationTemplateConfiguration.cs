using FactoryShield.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FactoryShield.Infrastructure.Persistence.Configurations;

public class NotificationTemplateConfiguration : IEntityTypeConfiguration<NotificationTemplate>
{
    public void Configure(EntityTypeBuilder<NotificationTemplate> builder)
    {
        builder.ToTable("NotificationTemplates");
        builder.HasKey(t => t.Id);
        builder.Property(t => t.TriggerEvent).IsRequired().HasMaxLength(100);
        builder.HasIndex(t => t.TriggerEvent).IsUnique();
        builder.Property(t => t.ChannelsJson).IsRequired().HasDefaultValue("[]");
        builder.Property(t => t.SubjectTemplate).IsRequired().HasMaxLength(500);
        builder.Property(t => t.BodyTemplate).IsRequired().HasMaxLength(4000);
    }
}
