# Investigation Workspace — Backend Plan

**Feature:** Investigation Workspace (Figma: `INC-YYYY-NNNN — Investigation Workspace`)
**Depends on:** FS-05 (Approver Approve/Reject) — incident must be `TRIAGED` before investigation opens
**New API base:** `POST|GET|PUT /api/v1/incidents/{id}/investigation`

---

## 1. New Domain Entities

### `Investigation`
```
src/FactoryShield.Domain/Entities/Investigation.cs
```
| Field | Type | Notes |
|---|---|---|
| `Id` | `Guid` | PK |
| `IncidentId` | `Guid` | FK → Incident (1-to-1) |
| `OwnerId` | `Guid?` | FK → User (Investigation Owner shown in Figma) |
| `InvestigationDate` | `DateTime?` | When investigation formally started |
| `TargetCompletion` | `DateTime?` | Due date shown in Figma header |
| `RiskLevel` | `RiskLevel` | Enum: High / Medium / Low |
| `Notes` | `string?` | "Investigation Notes" textarea |
| `FindingsSummary` | `string?` | "Findings Summary" textarea |
| `ImmediateActionTaken` | `string?` | "Immediate Action Taken" textarea |
| `LessonsLearned` | `string?` | "Lessons Learned" textarea |
| `CreatedAt` | `DateTime` | UTC |
| `UpdatedAt` | `DateTime` | UTC, updated on every save |

Navigation: `Incident Incident`, `User? Owner`, `ICollection<InvestigationChecklistItem> ChecklistItems`, `ICollection<InvestigationTimelineEvent> TimelineEvents`

---

### `InvestigationChecklistItem`
```
src/FactoryShield.Domain/Entities/InvestigationChecklistItem.cs
```
| Field | Type | Notes |
|---|---|---|
| `Id` | `Guid` | PK |
| `InvestigationId` | `Guid` | FK → Investigation |
| `Text` | `string` | Checklist item label |
| `IsCompleted` | `bool` | Default false |
| `SortOrder` | `int` | 1–8, controls display order |

**Default 8 items seeded on `OpenInvestigation`** (from Figma):
1. Review incident scene photos and videos
2. Collect witness statements from all involved parties
3. Inspect equipment and machinery involved
4. Check PPE compliance records
5. Review previous incidents in same area
6. Document environmental conditions at time of incident
7. Review relevant SOPs and work instructions
8. Assess training records of involved personnel

---

### `InvestigationTimelineEvent`
```
src/FactoryShield.Domain/Entities/InvestigationTimelineEvent.cs
```
| Field | Type | Notes |
|---|---|---|
| `Id` | `Guid` | PK |
| `InvestigationId` | `Guid` | FK → Investigation |
| `OccurredAt` | `DateTime` | UTC timestamp of event |
| `Description` | `string` | Free text label (e.g. "First aid given") |

---

## 2. New Enum

```
src/FactoryShield.Domain/Enums/RiskLevel.cs
```
```csharp
public enum RiskLevel { High = 1, Medium = 2, Low = 3 }
```

---

## 3. EF Configurations

Three new `IEntityTypeConfiguration<T>` files under:
```
src/FactoryShield.Infrastructure/Persistence/Configurations/
  InvestigationConfiguration.cs
  InvestigationChecklistItemConfiguration.cs
  InvestigationTimelineEventConfiguration.cs
```

- `Investigation` → table `Investigations`, unique index on `IncidentId`
- `InvestigationChecklistItem` → table `InvestigationChecklistItems`, cascade delete from Investigation
- `InvestigationTimelineEvent` → table `InvestigationTimelineEvents`, cascade delete from Investigation

Add `DbSet<Investigation>`, `DbSet<InvestigationChecklistItem>`, `DbSet<InvestigationTimelineEvent>` to `AppDbContext`.

---

## 4. Repository Interface + Implementation

```
src/FactoryShield.Application/Common/Interfaces/IInvestigationRepository.cs
src/FactoryShield.Infrastructure/Persistence/Repositories/InvestigationRepository.cs
```

Methods:
```csharp
Task<Investigation?> GetByIncidentIdAsync(Guid incidentId, CancellationToken ct);
Task AddAsync(Investigation investigation, CancellationToken ct);
Task SaveChangesAsync(CancellationToken ct);
Task<InvestigationChecklistItem?> GetChecklistItemAsync(Guid itemId, CancellationToken ct);
```

---

## 5. Application Layer

### Commands

#### `OpenInvestigationCommand`
```
src/FactoryShield.Application/Investigation/Commands/OpenInvestigationCommand.cs
```
- Input: `IncidentId`, `OwnerId` (from JWT)
- Guards: incident must exist; investigation must not already exist for this incident
- Creates `Investigation` + 8 default `InvestigationChecklistItem` rows + 1 initial `InvestigationTimelineEvent` ("Investigation started")
- Returns: `OpenInvestigationResult { InvestigationId }`

#### `SaveInvestigationCommand`
```
src/FactoryShield.Application/Investigation/Commands/SaveInvestigationCommand.cs
```
- Input: `IncidentId`, `Notes?`, `FindingsSummary?`, `ImmediateActionTaken?`, `LessonsLearned?`, `RiskLevel?`, `InvestigationDate?`, `TargetCompletion?`, `OwnerId?`
- Loads existing Investigation, patches provided fields, sets `UpdatedAt = UtcNow`
- Returns: `Unit`

#### `ToggleChecklistItemCommand`
```
src/FactoryShield.Application/Investigation/Commands/ToggleChecklistItemCommand.cs
```
- Input: `InvestigationId`, `ItemId`
- Flips `IsCompleted`; if completing final item, adds a timeline event "All checklist items completed"
- Returns: `ToggleChecklistItemResult { IsCompleted, CompletedCount, TotalCount }`

### Queries

#### `GetInvestigationQuery`
```
src/FactoryShield.Application/Investigation/Queries/GetInvestigationQuery.cs
```
- Input: `IncidentId`
- Returns: `InvestigationWorkspaceDto` (see § 6)

---

## 6. DTOs

```
src/FactoryShield.Application/Investigation/Models/InvestigationWorkspaceDto.cs
```
```csharp
public record InvestigationWorkspaceDto(
    Guid InvestigationId,
    string IncidentReference,
    string? OwnerName,
    DateTime? InvestigationDate,
    DateTime? TargetCompletion,
    string RiskLevel,
    string? Notes,
    string? FindingsSummary,
    string? ImmediateActionTaken,
    string? LessonsLearned,
    DateTime UpdatedAt,
    IReadOnlyList<ChecklistItemDto> Checklist,
    IReadOnlyList<TimelineEventDto> Timeline,
    IReadOnlyList<EvidenceItemDto> Evidence
);

public record ChecklistItemDto(Guid Id, string Text, bool IsCompleted, int SortOrder);
public record TimelineEventDto(Guid Id, DateTime OccurredAt, string Description);
public record EvidenceItemDto(Guid Id, string MimeType, string? EvidenceNote, string UploaderName, DateTime UploadedAt, string StorageKey);
```

---

## 7. API Controller

```
src/FactoryShield.Api/Controllers/InvestigationController.cs
```

| Method | Route | Auth | Description |
|---|---|---|---|
| `POST` | `/api/v1/incidents/{id}/investigation` | `[Authorize]` | Open (create) investigation |
| `GET` | `/api/v1/incidents/{id}/investigation` | `[Authorize]` | Get full workspace |
| `PUT` | `/api/v1/incidents/{id}/investigation` | `[Authorize]` | Save investigation fields |
| `POST` | `/api/v1/incidents/{id}/investigation/checklist/{itemId}/toggle` | `[Authorize]` | Toggle checklist item |

Evidence upload reuses the existing `POST /api/v1/incidents/{id}/attachments` endpoint — no new endpoint needed.

---

## 8. Program.cs Registration

```csharp
builder.Services.AddScoped<IInvestigationRepository, InvestigationRepository>();
builder.Services.AddScoped<IValidator<SaveInvestigationCommand>, SaveInvestigationCommandValidator>();
```

---

## 9. Migration

```
dotnet ef migrations add AddInvestigation --project src/FactoryShield.Infrastructure --startup-project src/FactoryShield.Api
```

Creates tables: `Investigations`, `InvestigationChecklistItems`, `InvestigationTimelineEvents`.

---

## 10. Implementation Order

1. Enums → Domain entities → EF configs → `AppDbContext` DbSets
2. Migration (`AddInvestigation`)
3. `IInvestigationRepository` interface → `InvestigationRepository`
4. `OpenInvestigationCommand` + Handler
5. `GetInvestigationQuery` + Handler (DTOs)
6. `SaveInvestigationCommand` + Handler + Validator
7. `ToggleChecklistItemCommand` + Handler
8. `InvestigationController` (4 endpoints)
9. Register services in `Program.cs`
10. Manual smoke test via Swagger
