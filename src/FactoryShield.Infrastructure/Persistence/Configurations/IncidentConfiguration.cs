using FactoryShield.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FactoryShield.Infrastructure.Persistence.Configurations;

public class IncidentConfiguration : IEntityTypeConfiguration<Incident>
{
    public void Configure(EntityTypeBuilder<Incident> builder)
    {
        builder.ToTable("Incidents");
        builder.HasKey(i => i.Id);

        builder.Property(i => i.IncidentReference).IsRequired().HasMaxLength(50);
        builder.HasIndex(i => i.IncidentReference).IsUnique();

        builder.Property(i => i.Status)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(50);

        builder.Property(i => i.Category).IsRequired().HasMaxLength(100);
        builder.Property(i => i.Severity).IsRequired();
        builder.Property(i => i.ShortDescription).IsRequired().HasMaxLength(500);
        builder.Property(i => i.Department).HasMaxLength(200);
        builder.Property(i => i.ClassificationCategory).HasMaxLength(100);
        builder.Property(i => i.SubCategory).HasMaxLength(100);
        builder.Property(i => i.Factory).HasMaxLength(100);
        builder.Property(i => i.Building).HasMaxLength(100);
        builder.Property(i => i.Floor).HasMaxLength(50);
        builder.Property(i => i.Equipment).HasMaxLength(100);
        builder.Property(i => i.ProductionOrder).HasMaxLength(100);
        builder.Property(i => i.Buyer).HasMaxLength(100);
        builder.Property(i => i.StyleNumber).HasMaxLength(100);
        builder.Property(i => i.ReporterName).HasMaxLength(200);
        builder.Property(i => i.EmployeeId).HasMaxLength(50);
        builder.Property(i => i.ReporterDepartment).HasMaxLength(100);
        builder.Property(i => i.ContactNumber).HasMaxLength(50);
        builder.Property(i => i.Witnesses).HasMaxLength(500);
        builder.Property(i => i.ImmediateActionTaken).HasMaxLength(500);
        builder.Property(i => i.ExactLocation).HasMaxLength(500);
        builder.Property(i => i.GpsCoordinates).HasMaxLength(100);
        builder.Property(i => i.AiSummary).HasMaxLength(2000);
        builder.Property(i => i.CreatedAt).IsRequired();

        builder.HasOne(i => i.Reporter)
            .WithMany()
            .HasForeignKey(i => i.ReporterId)
            .OnDelete(DeleteBehavior.SetNull)
            .IsRequired(false);

        builder.Property(i => i.Decision)
            .HasConversion<string>()
            .HasMaxLength(20);

        builder.Property(i => i.RejectReason).HasMaxLength(1000);
        builder.Property(i => i.EscalationLevel).IsRequired().HasDefaultValue(0);

        builder.HasOne(i => i.AssignedResolver)
            .WithMany()
            .HasForeignKey(i => i.AssignedResolverId)
            .OnDelete(DeleteBehavior.SetNull)
            .IsRequired(false);

        // FS-17 routing
        builder.Property(i => i.RouteCount).IsRequired().HasDefaultValue(0);
        builder.Property(i => i.LoopGuardTriggered).IsRequired().HasDefaultValue(false);

        // FS-18 merge
        builder.HasOne(i => i.MergedInto)
            .WithMany()
            .HasForeignKey(i => i.MergedIntoId)
            .OnDelete(DeleteBehavior.Restrict)
            .IsRequired(false);

        // FS-24 confidentiality
        builder.Property(i => i.ReportingMode).IsRequired().HasMaxLength(30).HasDefaultValue("normal");
        builder.Property(i => i.ReporterVisibility).IsRequired().HasMaxLength(20).HasDefaultValue("visible");
        builder.Property(i => i.AnonymousReferenceToken).IsRequired(false);

        // FS-26 QR entry
        builder.Property(i => i.SourceChannel).IsRequired().HasMaxLength(20).HasDefaultValue("manual");
        builder.Property(i => i.ManualOverrideReason).HasMaxLength(500);
        builder.HasOne(i => i.QrCode)
            .WithMany()
            .HasForeignKey(i => i.QrCodeId)
            .OnDelete(DeleteBehavior.SetNull)
            .IsRequired(false);
    }
}
