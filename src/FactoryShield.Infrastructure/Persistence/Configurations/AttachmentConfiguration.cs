using FactoryShield.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FactoryShield.Infrastructure.Persistence.Configurations;

public class AttachmentConfiguration : IEntityTypeConfiguration<Attachment>
{
    public void Configure(EntityTypeBuilder<Attachment> builder)
    {
        builder.ToTable("Attachments");
        builder.HasKey(a => a.Id);

        builder.Property(a => a.AttachmentType).IsRequired().HasMaxLength(50);
        builder.Property(a => a.UploadStatus).IsRequired().HasMaxLength(50);
        builder.Property(a => a.MimeType).IsRequired().HasMaxLength(100);
        builder.Property(a => a.FileSize).IsRequired();
        builder.Property(a => a.StorageKey).IsRequired().HasMaxLength(200);
        builder.Property(a => a.Sha256Hash).IsRequired().HasMaxLength(64);
        builder.Property(a => a.EvidenceNote).HasMaxLength(1000);
        builder.Property(a => a.UploadedAt).IsRequired();

        builder.HasOne(a => a.Incident)
            .WithMany()
            .HasForeignKey(a => a.IncidentId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(a => a.Uploader)
            .WithMany()
            .HasForeignKey(a => a.UploadedBy)
            .OnDelete(DeleteBehavior.SetNull)
            .IsRequired(false);

        builder.HasOne(a => a.CorrectiveAction)
            .WithMany()
            .HasForeignKey(a => a.CorrectiveActionId)
            .OnDelete(DeleteBehavior.SetNull)
            .IsRequired(false);
    }
}
