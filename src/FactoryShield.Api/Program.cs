using System.Text;
using System.Text.Json.Serialization;
using FactoryShield.Application.Approver.Commands;
using FactoryShield.Application.Auth.Commands;
using FactoryShield.Application.Common.Interfaces;
using FactoryShield.Application.Incidents.Commands;
using FactoryShield.Application.Jobs;
using FactoryShield.Infrastructure.Jobs;
using FactoryShield.Infrastructure.Persistence;
using FactoryShield.Infrastructure.Persistence.Repositories;
using FactoryShield.Infrastructure.Realtime;
using FactoryShield.Infrastructure.Services;
using FluentValidation;
using Hangfire;
using Hangfire.PostgreSql;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// --- Controllers + Swagger ---
builder.Services.AddControllers()
    .AddJsonOptions(options => options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter()));
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.OpenApiSecurityScheme
    {
        Type = Microsoft.OpenApi.SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        Description = "Paste your JWT token (without 'Bearer ' prefix). Obtained from POST /api/v1/auth/login."
    });

    options.AddSecurityRequirement(doc => new Microsoft.OpenApi.OpenApiSecurityRequirement
    {
        { new Microsoft.OpenApi.OpenApiSecuritySchemeReference("Bearer", doc), new List<string>() }
    });
});

// --- Database ---
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// --- JWT Authentication ---
var jwtKey = builder.Configuration["Jwt:Key"]!;
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
        };

        // SignalR clients can't set an Authorization header on the WebSocket
        // handshake, so accept the JWT via the "access_token" query string
        // for requests targeting the notifications hub.
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var accessToken = context.Request.Query["access_token"];
                var path = context.HttpContext.Request.Path;
                if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs"))
                {
                    context.Token = accessToken;
                }
                return Task.CompletedTask;
            }
        };
    });
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("ApproverOnly", policy => policy.RequireRole("APPROVER"));
    options.AddPolicy("ResolverOnly", policy => policy.RequireRole("RESOLVER"));
    options.AddPolicy("GovernanceOnly", policy => policy.RequireRole(
        "ADMIN", "APPROVER"));
    options.AddPolicy("ComplianceOfficerOnly", policy => policy.RequireRole(
        "ADMIN"));
    options.AddPolicy("AdminOnly", policy => policy.RequireRole("ADMIN"));
    // Everyone except REPORTER — the org-wide "All Incidents" view isn't scoped to a single reporter's own submissions.
    options.AddPolicy("AllIncidentsAccess", policy => policy.RequireRole(
        "ADMIN", "APPROVER", "RESOLVER"));
});

// --- MediatR ---
builder.Services.AddMediatR(cfg => cfg.RegisterServicesFromAssembly(typeof(LoginCommand).Assembly));

// --- SignalR (real-time notification push) ---
builder.Services.AddSignalR();

// --- Application / Infrastructure services ---
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IIncidentRepository, IncidentRepository>();
builder.Services.AddScoped<IAttachmentRepository, AttachmentRepository>();
builder.Services.AddScoped<IInvestigationRepository, InvestigationRepository>();
builder.Services.AddScoped<ICorrectiveActionRepository, CorrectiveActionRepository>();
builder.Services.AddScoped<ISlaClockRepository, SlaClockRepository>();
builder.Services.AddScoped<INotificationRepository, NotificationRepository>();
builder.Services.AddScoped<IEscalationRepository, EscalationRepository>();
builder.Services.AddScoped<IIncidentClaimRepository, IncidentClaimRepository>();
builder.Services.AddScoped<IRoutingLogRepository, RoutingLogRepository>();
builder.Services.AddScoped<IApprovalEventRepository, ApprovalEventRepository>();
builder.Services.AddScoped<IDashboardRepository, DashboardRepository>();
builder.Services.AddScoped<IIncidentStateLogRepository, IncidentStateLogRepository>();
builder.Services.AddScoped<IIdentityAccessAuditRepository, IdentityAccessAuditRepository>();
builder.Services.AddScoped<IIncidentStateLogger, IncidentStateLogger>();
builder.Services.AddScoped<IConfidentialityService, ConfidentialityService>();
builder.Services.AddScoped<IOfflineDraftRepository, OfflineDraftRepository>();
builder.Services.AddScoped<IQrCodeRepository, QrCodeRepository>();
builder.Services.AddScoped<IComplianceDashboardRepository, ComplianceDashboardRepository>();
builder.Services.AddScoped<IAdminRepository, AdminRepository>();
builder.Services.AddScoped<IAnalyticsRepository, AnalyticsRepository>();
builder.Services.AddScoped<INotificationDispatcher, NotificationDispatcher>();
builder.Services.AddScoped<INotificationPusher, SignalRNotificationPusher>();
builder.Services.AddScoped<IEscalationNotificationRecorder, EscalationNotificationRecorder>();
builder.Services.AddScoped<IEmailService, DevEmailService>();
builder.Services.AddScoped<ISmsService, DevSmsService>();
builder.Services.AddScoped<SlaCheckJob>();
builder.Services.AddScoped<ClaimReleaseJob>();
builder.Services.AddScoped<StaleDraftMonitorJob>();
builder.Services.AddScoped<NotificationReminderJob>();
builder.Services.AddScoped<LowPriorityDigestJob>();
builder.Services.AddScoped<IJwtService, JwtService>();

// --- Hangfire ---
var connStr = builder.Configuration.GetConnectionString("DefaultConnection")!;
builder.Services.AddHangfire(cfg => cfg
    .SetDataCompatibilityLevel(CompatibilityLevel.Version_180)
    .UseSimpleAssemblyNameTypeSerializer()
    .UseRecommendedSerializerSettings()
    .UsePostgreSqlStorage(options => options.UseNpgsqlConnection(connStr)));
builder.Services.AddHangfireServer();
builder.Services.AddScoped<IPasswordVerifier, PasswordVerifier>();
builder.Services.AddScoped<IIncidentStateMachine, IncidentStateMachine>();
builder.Services.AddSingleton<IFileStorageService, LocalFileStorageService>();
builder.Services.AddScoped<IValidator<CreateIncidentCommand>, CreateIncidentCommandValidator>();
builder.Services.AddScoped<IValidator<UploadAttachmentCommand>, UploadAttachmentCommandValidator>();
builder.Services.AddScoped<IValidator<RejectIncidentCommand>, RejectIncidentCommandValidator>();

// --- CORS for Angular ---
builder.Services.AddCors(options =>
{
    options.AddPolicy("Angular", policy =>
        policy.WithOrigins("http://localhost:4200")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials());
});

var app = builder.Build();

// --- Dev-only: seed demo users ---
if (app.Environment.IsDevelopment())
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await DataSeeder.SeedAsync(db);
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("Angular");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapHub<NotificationHub>("/hubs/notifications");

// Hangfire dashboard (dev-only; accessible at /hangfire)
if (app.Environment.IsDevelopment())
{
    app.UseHangfireDashboard("/hangfire", new DashboardOptions
    {
        Authorization = [] // open in dev; lock down in prod
    });
}

// Register SLA check recurring job — every 5 minutes
RecurringJob.AddOrUpdate<SlaCheckJob>(
    "sla-check",
    job => job.ExecuteAsync(CancellationToken.None),
    "*/5 * * * *");

// Auto-release expired claims — every 5 minutes
RecurringJob.AddOrUpdate<ClaimReleaseJob>(
    "claim-release",
    job => job.ExecuteAsync(CancellationToken.None),
    "*/5 * * * *");

// Stale offline draft monitor — every 30 minutes
RecurringJob.AddOrUpdate<StaleDraftMonitorJob>(
    "stale-draft-monitor",
    job => job.ExecuteAsync(CancellationToken.None),
    "*/30 * * * *");

// Notification reminder — every 15 minutes
RecurringJob.AddOrUpdate<NotificationReminderJob>(
    "notification-reminder",
    job => job.ExecuteAsync(CancellationToken.None),
    "*/15 * * * *");

// Medium/Low priority new-incident digest — every 15 minutes (US-10)
RecurringJob.AddOrUpdate<LowPriorityDigestJob>(
    "low-priority-digest",
    job => job.ExecuteAsync(CancellationToken.None),
    "*/15 * * * *");

app.Run();
