using FactoryShield.Application.Common.Interfaces;
using FactoryShield.Domain.Entities;
using FactoryShield.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace FactoryShield.Infrastructure.Persistence.Repositories;

public class IncidentRepository : IIncidentRepository
{
    private readonly AppDbContext _db;

    public IncidentRepository(AppDbContext db) => _db = db;

    public Task<int> CountByYearAsync(int year, CancellationToken ct = default)
    {
        var start = new DateTime(year, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        var end = new DateTime(year + 1, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        return _db.Incidents
            .Where(i => i.CreatedAt >= start && i.CreatedAt < end)
            .CountAsync(ct);
    }

    public Task<Incident?> FindByIdAsync(Guid id, CancellationToken ct = default) =>
        _db.Incidents
           .Include(i => i.Reporter).ThenInclude(u => u!.Role)
           .Include(i => i.AssignedResolver).ThenInclude(u => u!.Role)
           .FirstOrDefaultAsync(i => i.Id == id, ct);

    public Task<Incident?> FindByReferenceAsync(string incidentReference, CancellationToken ct = default) =>
        _db.Incidents
           .Include(i => i.Reporter).ThenInclude(u => u!.Role)
           .Include(i => i.AssignedResolver).ThenInclude(u => u!.Role)
           .FirstOrDefaultAsync(i => i.IncidentReference == incidentReference, ct);

    public async Task<IReadOnlyList<Incident>> GetByReporterAsync(Guid reporterId, CancellationToken ct = default) =>
        await _db.Incidents
            .Where(i => i.ReporterId == reporterId)
            .OrderByDescending(i => i.CreatedAt)
            .ToListAsync(ct);

    public async Task<IReadOnlyList<Incident>> GetAllAsync(CancellationToken ct = default) =>
        await _db.Incidents
            .Include(i => i.Reporter)
            .Include(i => i.AssignedResolver)
            .OrderByDescending(i => i.CreatedAt)
            .ToListAsync(ct);

    public Task<Incident?> GetByIdAsync(Guid id, CancellationToken ct = default) =>
        _db.Incidents.FirstOrDefaultAsync(i => i.Id == id, ct);

    public async Task<IReadOnlyList<Incident>> GetByStatusAsync(IncidentStatus status, CancellationToken ct = default) =>
        await _db.Incidents
            .Where(i => i.Status == status)
            .OrderBy(i => i.Severity)
            .ThenBy(i => i.CreatedAt)
            .ToListAsync(ct);

    public async Task<IReadOnlyList<Incident>> GetByStatusesAsync(
        IReadOnlyCollection<IncidentStatus> statuses, CancellationToken ct = default) =>
        await _db.Incidents
            .Where(i => statuses.Contains(i.Status))
            .OrderBy(i => i.Severity)
            .ThenBy(i => i.CreatedAt)
            .ToListAsync(ct);

    public async Task<IReadOnlyList<Incident>> GetByStatusesWithReporterAsync(
        IReadOnlyCollection<IncidentStatus> statuses, CancellationToken ct = default) =>
        await _db.Incidents
            .Include(i => i.Reporter)
            .Where(i => statuses.Contains(i.Status))
            .OrderBy(i => i.Severity)
            .ThenBy(i => i.CreatedAt)
            .ToListAsync(ct);

    public async Task<IReadOnlyList<Incident>> GetByResolverAsync(Guid resolverId, CancellationToken ct = default) =>
        await _db.Incidents
            .Where(i => i.AssignedResolverId == resolverId
                     && i.Status != IncidentStatus.Closed
                     && i.Status != IncidentStatus.Rejected)
            .OrderBy(i => i.Severity)
            .ThenBy(i => i.CreatedAt)
            .ToListAsync(ct);

    public async Task AddAsync(Incident incident, CancellationToken ct = default) =>
        await _db.Incidents.AddAsync(incident, ct);

    public Task SaveChangesAsync(CancellationToken ct = default) =>
        _db.SaveChangesAsync(ct);
}
