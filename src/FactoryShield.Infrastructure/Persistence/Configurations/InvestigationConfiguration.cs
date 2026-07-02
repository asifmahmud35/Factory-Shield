using FactoryShield.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FactoryShield.Infrastructure.Persistence.Configurations;

public class InvestigationConfiguration : IEntityTypeConfiguration<Investigation>
{
    public void Configure(EntityTypeBuilder<Investigation> builder)
    {
        builder.ToTable("Investigations");
        builder.HasKey(i => i.Id);

        builder.HasIndex(i => i.IncidentId).IsUnique();

        builder.HasOne(i => i.Incident)
            .WithOne()
            .HasForeignKey<Investigation>(i => i.IncidentId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Property(i => i.Owner).HasMaxLength(200);
        builder.Property(i => i.RootCauseCode).HasMaxLength(50);
        builder.Property(i => i.RootCauseDescription).HasMaxLength(500);
        builder.Property(i => i.InvestigationStatus).IsRequired().HasMaxLength(50).HasDefaultValue("IN_PROGRESS");
        builder.Property(i => i.Notes).HasMaxLength(4000);
        builder.Property(i => i.FindingsSummary).HasMaxLength(4000);
        builder.Property(i => i.ImmediateActionTaken).HasMaxLength(2000);
        builder.Property(i => i.LessonsLearned).HasMaxLength(2000);

        builder.Property(i => i.RcaMethod).HasMaxLength(50);
        builder.Property(i => i.ProblemStatement).HasMaxLength(2000);
        builder.Property(i => i.WhyEntriesJson).HasColumnType("jsonb");
        builder.Property(i => i.FishboneJson).HasColumnType("jsonb");
        builder.Property(i => i.RcaChecklistJson).HasColumnType("jsonb");
        builder.Property(i => i.StructuredCategory).HasMaxLength(200);
        builder.Property(i => i.RcaStatus).IsRequired().HasMaxLength(50).HasDefaultValue("Draft");

        builder.Property(i => i.RiskLevel)
            .HasConversion<string>()
            .HasMaxLength(20);

        builder.Property(i => i.OpenedAt).IsRequired();
    }
}
