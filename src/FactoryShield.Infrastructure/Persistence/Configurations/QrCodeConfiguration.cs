using FactoryShield.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FactoryShield.Infrastructure.Persistence.Configurations;

public class QrCodeConfiguration : IEntityTypeConfiguration<QrCode>
{
    public void Configure(EntityTypeBuilder<QrCode> builder)
    {
        builder.ToTable("QrCodes");
        builder.HasKey(q => q.Id);

        builder.Property(q => q.Code).IsRequired().HasMaxLength(64);
        builder.HasIndex(q => q.Code).IsUnique();

        builder.Property(q => q.QrType).IsRequired().HasMaxLength(50);
        builder.Property(q => q.Label).IsRequired().HasMaxLength(200);
        builder.Property(q => q.FactoryId).HasMaxLength(100);
        builder.Property(q => q.SectionId).HasMaxLength(100);
        builder.Property(q => q.LineId).HasMaxLength(100);
        builder.Property(q => q.MachineId).HasMaxLength(100);
        builder.Property(q => q.IsActive).HasDefaultValue(true);
        builder.Property(q => q.ScanCount).HasDefaultValue(0);

        builder.HasOne(q => q.CreatedBy)
            .WithMany()
            .HasForeignKey(q => q.CreatedById)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
