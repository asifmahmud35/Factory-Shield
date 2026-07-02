using FactoryShield.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace FactoryShield.Infrastructure.Persistence;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Role> Roles => Set<Role>();
    public DbSet<Incident> Incidents => Set<Incident>();
    public DbSet<Attachment> Attachments => Set<Attachment>();
    public DbSet<Investigation> Investigations => Set<Investigation>();
    public DbSet<InvestigationChecklistItem> InvestigationChecklistItems => Set<InvestigationChecklistItem>();
    public DbSet<InvestigationTimelineEvent> InvestigationTimelineEvents => Set<InvestigationTimelineEvent>();
    public DbSet<CorrectiveAction> CorrectiveActions => Set<CorrectiveAction>();
    public DbSet<SlaClock> SlaClocks => Set<SlaClock>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<Escalation> Escalations => Set<Escalation>();
    public DbSet<IncidentClaim> IncidentClaims => Set<IncidentClaim>();
    public DbSet<IncidentRoutingLog> IncidentRoutingLogs => Set<IncidentRoutingLog>();
    public DbSet<ApprovalEvent> ApprovalEvents => Set<ApprovalEvent>();
    public DbSet<IncidentStateLog> IncidentStateLogs => Set<IncidentStateLog>();
    public DbSet<IdentityAccessAudit> IdentityAccessAudits => Set<IdentityAccessAudit>();
    public DbSet<OfflineDraft> OfflineDrafts => Set<OfflineDraft>();
    public DbSet<QrCode> QrCodes => Set<QrCode>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Department> Departments => Set<Department>();
    public DbSet<SeverityLevel> SeverityLevels => Set<SeverityLevel>();
    public DbSet<PriorityLevel> PriorityLevels => Set<PriorityLevel>();
    public DbSet<Factory> Factories => Set<Factory>();
    public DbSet<ProductionLine> ProductionLines => Set<ProductionLine>();
    public DbSet<NotificationTemplate> NotificationTemplates => Set<NotificationTemplate>();
    public DbSet<EscalationRule> EscalationRules => Set<EscalationRule>();
    public DbSet<EscalationNotificationRecord> EscalationNotificationRecords => Set<EscalationNotificationRecord>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
        base.OnModelCreating(modelBuilder);
    }
}
