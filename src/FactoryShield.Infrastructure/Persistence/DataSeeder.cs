using System.Text.Json;
using FactoryShield.Domain.Entities;
using FactoryShield.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;

namespace FactoryShield.Infrastructure.Persistence;

public static class DataSeeder
{
    private static readonly JsonSerializerOptions JsonOpts = new() { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };

    public static async Task SeedAsync(AppDbContext db)
    {
        await SeedRolesAsync(db);
        await SeedUsersAsync(db);
        await EnsureAdminUserAsync(db);
        await EnsureAdminRoleAsync(db);
        await SeedQrCodesAsync(db);
        await SeedAdminMasterDataAsync(db);
        await EnsureDemoNotificationsAsync(db);
    }

    private static async Task EnsureAdminUserAsync(AppDbContext db)
    {
        if (await db.Users.AnyAsync(u => u.Email == "admin@factoryshield.dev")) return;

        var adminRole = await db.Roles.FirstOrDefaultAsync(r => r.Code == "ADMIN")
            ?? await db.Roles.FirstOrDefaultAsync(r => r.Code == "APPROVER");
        if (adminRole is null) return;

        var verifier = new PasswordVerifier();
        db.Users.Add(new User
        {
            Id = Guid.NewGuid(),
            Name = "Admin User",
            Email = "admin@factoryshield.dev",
            RoleId = adminRole.Id,
            PasswordHash = verifier.Hash("Admin123!")
        });
        await db.SaveChangesAsync();
    }

    private static async Task EnsureAdminRoleAsync(AppDbContext db)
    {
        var adminRole = await db.Roles.FirstOrDefaultAsync(r => r.Code == "ADMIN");
        if (adminRole is null) return;

        var adminUser = await db.Users.FirstOrDefaultAsync(u => u.Email == "admin@factoryshield.dev");
        if (adminUser is not null && adminUser.RoleId != adminRole.Id)
        {
            adminUser.RoleId = adminRole.Id;
            await db.SaveChangesAsync();
        }
    }

    private static async Task SeedRolesAsync(AppDbContext db)
    {
        var builtIn = new (string Code, string Label, string[] Permissions)[]
        {
            ("REPORTER", "Worker", ["report_incident", "view_own_incidents", "upload_images"]),
            ("APPROVER", "Approver", ["triage_incident", "approve_incident", "escalate"]),
            ("RESOLVER", "Resolver", ["investigate", "manage_capa", "resolve_incident"]),
            ("ADMIN", "Administrator", ["admin_all", "manage_users", "manage_config", "view_dashboard", "acknowledge_escalation", "executive_reports", "view_compliance", "audit_trail", "investigate"])
        };

        foreach (var (code, label, perms) in builtIn)
        {
            if (await db.Roles.AnyAsync(r => r.Code == code)) continue;
            db.Roles.Add(new Role
            {
                Id = Guid.NewGuid(),
                Code = code,
                Label = label,
                PermissionsJson = JsonSerializer.Serialize(perms, JsonOpts)
            });
        }
        await db.SaveChangesAsync();
    }

    private static async Task SeedUsersAsync(AppDbContext db)
    {
        if (await db.Users.AnyAsync()) return;

        var roles = await db.Roles.ToDictionaryAsync(r => r.Code, r => r.Id);
        var verifier = new PasswordVerifier();

        var users = new[]
        {
            new User { Id = Guid.NewGuid(), Name = "Reporter User", Email = "reporter@factoryshield.dev", RoleId = roles["REPORTER"], PasswordHash = verifier.Hash("Reporter123!") },
            new User { Id = Guid.NewGuid(), Name = "Approver User", Email = "approver@factoryshield.dev", RoleId = roles["APPROVER"], PasswordHash = verifier.Hash("Approver123!") },
            new User { Id = Guid.NewGuid(), Name = "Resolver User", Email = "resolver@factoryshield.dev", RoleId = roles["RESOLVER"], PasswordHash = verifier.Hash("Resolver123!") },
            new User { Id = Guid.NewGuid(), Name = "Admin User", Email = "admin@factoryshield.dev", RoleId = roles["ADMIN"], PasswordHash = verifier.Hash("Admin123!") }
        };
        db.Users.AddRange(users);
        await db.SaveChangesAsync();
    }

    private static async Task SeedQrCodesAsync(AppDbContext db)
    {
        if (await db.QrCodes.AnyAsync()) return;

        var admin = await db.Users.FirstOrDefaultAsync(u => u.Email == "admin@factoryshield.dev");
        if (admin is null) return;

        var qrCodes = new[]
        {
            new QrCode { Id = Guid.NewGuid(), Code = "LINE7-QR", QrType = "line", FactoryId = "Factory-A", LineId = "Line 7", Label = "Line 7 — Sewing Floor", IsActive = true, CreatedById = admin.Id, CreatedAt = DateTime.UtcNow },
            new QrCode { Id = Guid.NewGuid(), Code = "SWM-0042-QR", QrType = "machine", FactoryId = "Factory-A", LineId = "Line 3", MachineId = "SWM-0042", Label = "Sewing Machine M-0042", IsActive = true, CreatedById = admin.Id, CreatedAt = DateTime.UtcNow },
            new QrCode { Id = Guid.NewGuid(), Code = "SAFETY-POSTER-1", QrType = "safety_poster", FactoryId = "Factory-A", SectionId = "Main Entrance", Label = "Safety Poster — Main Entrance", IsActive = true, CreatedById = admin.Id, CreatedAt = DateTime.UtcNow }
        };
        db.QrCodes.AddRange(qrCodes);
        await db.SaveChangesAsync();
    }

    private static async Task SeedAdminMasterDataAsync(AppDbContext db)
    {
        if (await db.Categories.AnyAsync()) return;

        db.Categories.Add(new Category
        {
            Id = Guid.NewGuid(),
            Name = "Occupational Safety",
            Active = true,
            SubcategoriesJson = JsonSerializer.Serialize(new[] { "Needle Injury", "Laceration", "Burn", "Slip & Fall" }, JsonOpts)
        });
        db.Categories.Add(new Category
        {
            Id = Guid.NewGuid(),
            Name = "Equipment / Machine",
            Active = true,
            SubcategoriesJson = JsonSerializer.Serialize(new[] { "Guard Missing", "Machine Fault", "Maintenance Issue" }, JsonOpts)
        });

        db.Departments.AddRange(
            new Department { Id = Guid.NewGuid(), Name = "Sewing", Manager = "Sumaiya Akter", Location = "Building A, Floor 2", Active = true },
            new Department { Id = Guid.NewGuid(), Name = "Cutting", Manager = "Karim Hassan", Location = "Building A, Floor 1", Active = true },
            new Department { Id = Guid.NewGuid(), Name = "Finishing", Manager = "Rina Begum", Location = "Building B, Floor 1", Active = true }
        );

        db.SeverityLevels.AddRange(
            new SeverityLevel { Id = Guid.NewGuid(), Code = "L1", Label = "Critical", Color = "#ef4444", SlaHours = 2, AutoEscalate = true, SeverityValue = 1 },
            new SeverityLevel { Id = Guid.NewGuid(), Code = "L2", Label = "High", Color = "#f97316", SlaHours = 8, AutoEscalate = true, SeverityValue = 2 },
            new SeverityLevel { Id = Guid.NewGuid(), Code = "L3", Label = "Medium", Color = "#eab308", SlaHours = 24, AutoEscalate = false, SeverityValue = 3 },
            new SeverityLevel { Id = Guid.NewGuid(), Code = "L4", Label = "Low", Color = "#22c55e", SlaHours = 72, AutoEscalate = false, SeverityValue = 4 }
        );

        db.PriorityLevels.AddRange(
            new PriorityLevel { Id = Guid.NewGuid(), Code = "P1", Label = "Critical", Color = "#ef4444", PriorityValue = 1 },
            new PriorityLevel { Id = Guid.NewGuid(), Code = "P2", Label = "High", Color = "#f97316", PriorityValue = 2 },
            new PriorityLevel { Id = Guid.NewGuid(), Code = "P3", Label = "Medium", Color = "#eab308", PriorityValue = 3 },
            new PriorityLevel { Id = Guid.NewGuid(), Code = "P4", Label = "Low", Color = "#22c55e", PriorityValue = 4 }
        );

        var factory = new Factory { Id = Guid.NewGuid(), Name = "Factory A", Location = "Dhaka Industrial Zone", Active = true };
        db.Factories.Add(factory);
        db.ProductionLines.AddRange(
            new ProductionLine { Id = Guid.NewGuid(), FactoryId = factory.Id, Name = "Line 3", Active = true },
            new ProductionLine { Id = Guid.NewGuid(), FactoryId = factory.Id, Name = "Line 7", Active = true }
        );

        db.NotificationTemplates.AddRange(
            new NotificationTemplate
            {
                Id = Guid.NewGuid(),
                TriggerEvent = "INCIDENT_CRITICAL",
                ChannelsJson = JsonSerializer.Serialize(new[] { "Email", "SMS", "Push" }, JsonOpts),
                SubjectTemplate = "CRITICAL: {{category}} reported at {{location}}",
                BodyTemplate = "Incident {{reference}} requires immediate attention.",
                Active = true
            },
            new NotificationTemplate
            {
                Id = Guid.NewGuid(),
                TriggerEvent = "ESCALATION_ACK_REQUIRED",
                ChannelsJson = JsonSerializer.Serialize(new[] { "Email", "SMS" }, JsonOpts),
                SubjectTemplate = "Escalation: {{reference}} needs acknowledgment",
                BodyTemplate = "Incident {{reference}} has been escalated and requires manager acknowledgment.",
                Active = true
            }
        );

        db.EscalationRules.AddRange(
            new EscalationRule
            {
                Id = Guid.NewGuid(),
                Name = "High Severity Auto Escalation",
                Description = "Escalates to supervisor if not acknowledged within 2h",
                TriggerAfterMinutes = 120,
                ChannelsJson = JsonSerializer.Serialize(new[] { "Email", "SMS" }, JsonOpts),
                RecipientsJson = JsonSerializer.Serialize(new[] { "Supervisor", "Safety Manager" }, JsonOpts),
                Active = true
            },
            new EscalationRule
            {
                Id = Guid.NewGuid(),
                Name = "Critical Immediate Escalation",
                Description = "Immediate escalation for critical incidents",
                TriggerAfterMinutes = 30,
                ChannelsJson = JsonSerializer.Serialize(new[] { "Email", "SMS", "Push" }, JsonOpts),
                RecipientsJson = JsonSerializer.Serialize(new[] { "Factory Manager", "Safety Manager" }, JsonOpts),
                Active = true
            }
        );

        await db.SaveChangesAsync();
    }

    /// <summary>
    /// Seeds in-app notifications for demo users so the Notifications UI has real data on first run.
    /// Idempotent — skips if the admin user already has notifications.
    /// </summary>
    private static async Task EnsureDemoNotificationsAsync(AppDbContext db)
    {
        var admin = await db.Users.FirstOrDefaultAsync(u => u.Email == "admin@factoryshield.dev");
        if (admin is null) return;

        if (await db.Notifications.AnyAsync(n => n.RecipientId == admin.Id)) return;

        var now = DateTime.UtcNow;
        var seeds = new[]
        {
            (Subject: "Critical Incident Reported", Body: "Chemical spill in Finishing section — INC-2024-0891",
             Type: "INCIDENT_CRITICAL", Trigger: "INCIDENT_CRITICAL", MinutesAgo: 9, IsRead: false,
             DeepLink: "/incidents/INC-2024-0891"),
            (Subject: "Approval Required", Body: "CAPA verification pending for INC-2024-0879",
             Type: "APPROVAL_GATE", Trigger: "APPROVAL_GATE", MinutesAgo: 60, IsRead: false,
             DeepLink: "/approver/queue"),
            (Subject: "CAPA Overdue", Body: "Action CA-005 is 2 days past due date",
             Type: "CAPA_OVERDUE", Trigger: "CAPA_OVERDUE", MinutesAgo: 180, IsRead: false,
             DeepLink: "/capa"),
            (Subject: "Investigation Completed", Body: "INC-2024-0888 investigation report submitted",
             Type: "INVESTIGATION", Trigger: "INVESTIGATION", MinutesAgo: 300, IsRead: true,
             DeepLink: "/incidents/INC-2024-0888"),
            (Subject: "Incident Closed", Body: "INC-2024-0880 has been successfully closed",
             Type: "INCIDENT_CLOSED", Trigger: "INCIDENT_CLOSED", MinutesAgo: 1440, IsRead: true,
             DeepLink: "/incidents/INC-2024-0880"),
        };

        foreach (var s in seeds)
        {
            var created = now.AddMinutes(-s.MinutesAgo);
            db.Notifications.Add(new Notification
            {
                Id = Guid.NewGuid(),
                RecipientId = admin.Id,
                Type = s.Type,
                Stage = s.Trigger,
                TriggerEvent = s.Trigger,
                Subject = s.Subject,
                Body = s.Body,
                Channel = "InApp",
                DeepLinkPath = s.DeepLink,
                CreatedAt = created,
                SentAt = created,
                DeliveryStatus = "Sent",
                IsRead = s.IsRead,
                ReadAt = s.IsRead ? created.AddMinutes(5) : null,
                IdempotencyKey = $"seed-{admin.Id}-{s.Trigger}-{s.MinutesAgo}",
            });
        }

        // Approver gets a subset for queue testing
        var approver = await db.Users.FirstOrDefaultAsync(u => u.Email == "approver@factoryshield.dev");
        if (approver is not null)
        {
            db.Notifications.AddRange(
                new Notification
                {
                    Id = Guid.NewGuid(),
                    RecipientId = approver.Id,
                    Type = "APPROVAL_GATE",
                    Stage = "APPROVAL_GATE",
                    TriggerEvent = "APPROVAL_GATE",
                    Subject = "Approval Required",
                    Body = "Incident INC-2024-0892 awaiting triage decision",
                    Channel = "InApp",
                    DeepLinkPath = "/approver/queue",
                    CreatedAt = now.AddMinutes(-25),
                    SentAt = now.AddMinutes(-25),
                    DeliveryStatus = "Sent",
                    IsRead = false,
                    IdempotencyKey = $"seed-{approver.Id}-approval-0892",
                },
                new Notification
                {
                    Id = Guid.NewGuid(),
                    RecipientId = approver.Id,
                    Type = "ESCALATION",
                    Stage = "ESCALATION",
                    TriggerEvent = "ESCALATION",
                    Subject = "Escalation Alert",
                    Body = "INC-2024-0032 escalated — needle injury on Line 3",
                    Channel = "InApp",
                    DeepLinkPath = "/escalation",
                    CreatedAt = now.AddHours(-2),
                    SentAt = now.AddHours(-2),
                    DeliveryStatus = "Sent",
                    IsRead = true,
                    ReadAt = now.AddHours(-1),
                    IdempotencyKey = $"seed-{approver.Id}-escalation-0032",
                });
        }

        await db.SaveChangesAsync();
    }
}
