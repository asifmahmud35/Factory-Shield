using System.Text.Json;
using FactoryShield.Application.Common.Interfaces;
using FactoryShield.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FactoryShield.Api.Controllers;

[ApiController]
[Route("api/v1/admin")]
[Authorize(Policy = "AdminOnly")]
public class AdminController : ControllerBase
{
    private static readonly JsonSerializerOptions JsonOpts = new() { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };

    private readonly IAdminRepository _admin;

    public AdminController(IAdminRepository admin) => _admin = admin;

    // ── Roles ────────────────────────────────────────────────────────────────

    [HttpGet("roles")]
    public async Task<IActionResult> GetRoles(CancellationToken ct)
    {
        var roles = await _admin.GetRolesAsync(ct);
        var result = new List<object>();
        foreach (var role in roles)
        {
            var userCount = await _admin.CountUsersInRoleAsync(role.Id, ct);
            result.Add(new
            {
                role.Id,
                role.Code,
                role.Label,
                userCount,
                permissions = ParseJsonArray(role.PermissionsJson)
            });
        }
        return Ok(result);
    }

    [HttpPost("roles")]
    public async Task<IActionResult> CreateRole([FromBody] CreateRoleRequest req, CancellationToken ct)
    {
        if (await _admin.FindRoleByCodeAsync(req.Code, ct) is not null)
            return Conflict(new { error = $"Role code '{req.Code}' already exists." });

        var role = new Role
        {
            Id = Guid.NewGuid(),
            Code = req.Code.ToUpperInvariant(),
            Label = req.Label ?? req.Code,
            PermissionsJson = SerializeJson(req.Permissions ?? [])
        };
        await _admin.AddRoleAsync(role, ct);
        await _admin.SaveChangesAsync(ct);
        return StatusCode(201, new { role.Id, role.Code, role.Label });
    }

    [HttpPut("roles/{id:guid}")]
    public async Task<IActionResult> UpdateRole(Guid id, [FromBody] UpdateRoleRequest req, CancellationToken ct)
    {
        var role = await _admin.FindRoleByIdAsync(id, ct);
        if (role is null) return NotFound();

        if (req.Label is not null) role.Label = req.Label;
        if (req.Permissions is not null) role.PermissionsJson = SerializeJson(req.Permissions);

        await _admin.SaveChangesAsync(ct);
        return Ok();
    }

    [HttpDelete("roles/{id:guid}")]
    public async Task<IActionResult> DeleteRole(Guid id, CancellationToken ct)
    {
        var role = await _admin.FindRoleByIdAsync(id, ct);
        if (role is null) return NotFound();

        var userCount = await _admin.CountUsersInRoleAsync(id, ct);
        if (userCount > 0)
            return Conflict(new { error = $"Cannot delete role with {userCount} assigned user(s)." });

        await _admin.DeleteRoleAsync(role, ct);
        await _admin.SaveChangesAsync(ct);
        return Ok();
    }

    // ── Users ────────────────────────────────────────────────────────────────

    [HttpGet("users")]
    public async Task<IActionResult> GetUsers(CancellationToken ct)
    {
        var users = await _admin.GetUsersAsync(ct);
        return Ok(users.Select(u => new
        {
            u.Id,
            u.Name,
            u.Email,
            u.IsActive,
            role = u.Role.Code,
            roleId = u.RoleId,
            roleLabel = u.Role.Label
        }));
    }

    [HttpPost("users/{userId:guid}/roles")]
    public async Task<IActionResult> AssignRole(Guid userId, [FromBody] AssignRoleRequest req, CancellationToken ct)
    {
        var user = await _admin.FindUserByIdAsync(userId, ct);
        if (user is null) return NotFound(new { error = "User not found." });

        var role = await _admin.FindRoleByIdAsync(req.RoleId, ct);
        if (role is null) return NotFound(new { error = "Role not found." });

        user.RoleId = role.Id;
        await _admin.SaveChangesAsync(ct);
        return Ok(new { userId, roleId = role.Id, role = role.Code });
    }

    [HttpDelete("users/{userId:guid}/roles/{roleId:guid}")]
    public async Task<IActionResult> RemoveRole(Guid userId, Guid roleId, CancellationToken ct)
    {
        var user = await _admin.FindUserByIdAsync(userId, ct);
        if (user is null) return NotFound();

        if (user.RoleId != roleId)
            return NotFound(new { error = "User does not have this role." });

        var reporter = await _admin.FindRoleByCodeAsync("REPORTER", ct);
        if (reporter is null)
            return BadRequest(new { error = "Default REPORTER role not found." });

        user.RoleId = reporter.Id;
        await _admin.SaveChangesAsync(ct);
        return Ok();
    }

    // ── Categories ───────────────────────────────────────────────────────────

    [HttpGet("categories")]
    public async Task<IActionResult> GetCategories(CancellationToken ct)
    {
        var categories = await _admin.GetCategoriesAsync(ct);
        return Ok(categories.Select(c => new
        {
            c.Id,
            c.Name,
            c.Active,
            subcategories = ParseJsonArray(c.SubcategoriesJson)
        }));
    }

    [HttpPost("categories")]
    public async Task<IActionResult> CreateCategory([FromBody] CreateCategoryRequest req, CancellationToken ct)
    {
        var category = new Category
        {
            Id = Guid.NewGuid(),
            Name = req.Name,
            Active = req.Active ?? true,
            SubcategoriesJson = SerializeJson(req.Subcategories ?? [])
        };
        await _admin.AddCategoryAsync(category, ct);
        await _admin.SaveChangesAsync(ct);
        return StatusCode(201, new { category.Id, category.Name });
    }

    [HttpPut("categories/{id:guid}")]
    public async Task<IActionResult> UpdateCategory(Guid id, [FromBody] UpdateCategoryRequest req, CancellationToken ct)
    {
        var category = await _admin.FindCategoryByIdAsync(id, ct);
        if (category is null) return NotFound();

        if (req.Name is not null) category.Name = req.Name;
        if (req.Active.HasValue) category.Active = req.Active.Value;
        if (req.Subcategories is not null) category.SubcategoriesJson = SerializeJson(req.Subcategories);

        await _admin.SaveChangesAsync(ct);
        return Ok();
    }

    [HttpDelete("categories/{id:guid}")]
    public async Task<IActionResult> DeleteCategory(Guid id, CancellationToken ct)
    {
        var category = await _admin.FindCategoryByIdAsync(id, ct);
        if (category is null) return NotFound();

        await _admin.DeleteCategoryAsync(category, ct);
        await _admin.SaveChangesAsync(ct);
        return Ok();
    }

    [HttpPost("categories/{id:guid}/subcategories")]
    public async Task<IActionResult> AddSubcategory(Guid id, [FromBody] SubcategoryRequest req, CancellationToken ct)
    {
        var category = await _admin.FindCategoryByIdAsync(id, ct);
        if (category is null) return NotFound();

        var subs = ParseJsonArray(category.SubcategoriesJson);
        if (!subs.Contains(req.Name, StringComparer.OrdinalIgnoreCase))
            subs.Add(req.Name);
        category.SubcategoriesJson = SerializeJson(subs);
        await _admin.SaveChangesAsync(ct);
        return Ok(new { subcategories = subs });
    }

    [HttpDelete("categories/{id:guid}/subcategories/{sub}")]
    public async Task<IActionResult> RemoveSubcategory(Guid id, string sub, CancellationToken ct)
    {
        var category = await _admin.FindCategoryByIdAsync(id, ct);
        if (category is null) return NotFound();

        var subs = ParseJsonArray(category.SubcategoriesJson);
        subs.RemoveAll(s => s.Equals(sub, StringComparison.OrdinalIgnoreCase));
        category.SubcategoriesJson = SerializeJson(subs);
        await _admin.SaveChangesAsync(ct);
        return Ok();
    }

    // ── Departments ──────────────────────────────────────────────────────────

    [HttpGet("departments")]
    public async Task<IActionResult> GetDepartments(CancellationToken ct) =>
        Ok((await _admin.GetDepartmentsAsync(ct)).Select(d => new
        {
            d.Id, d.Name, d.Manager, d.Location, d.Active
        }));

    [HttpPost("departments")]
    public async Task<IActionResult> CreateDepartment([FromBody] CreateDepartmentRequest req, CancellationToken ct)
    {
        var dept = new Department
        {
            Id = Guid.NewGuid(),
            Name = req.Name,
            Manager = req.Manager,
            Location = req.Location,
            Active = req.Active ?? true
        };
        await _admin.AddDepartmentAsync(dept, ct);
        await _admin.SaveChangesAsync(ct);
        return StatusCode(201, new { dept.Id, dept.Name });
    }

    [HttpPut("departments/{id:guid}")]
    public async Task<IActionResult> UpdateDepartment(Guid id, [FromBody] UpdateDepartmentRequest req, CancellationToken ct)
    {
        var dept = await _admin.FindDepartmentByIdAsync(id, ct);
        if (dept is null) return NotFound();

        if (req.Name is not null) dept.Name = req.Name;
        if (req.Manager is not null) dept.Manager = req.Manager;
        if (req.Location is not null) dept.Location = req.Location;
        if (req.Active.HasValue) dept.Active = req.Active.Value;

        await _admin.SaveChangesAsync(ct);
        return Ok();
    }

    [HttpDelete("departments/{id:guid}")]
    public async Task<IActionResult> DeleteDepartment(Guid id, CancellationToken ct)
    {
        var dept = await _admin.FindDepartmentByIdAsync(id, ct);
        if (dept is null) return NotFound();

        await _admin.DeleteDepartmentAsync(dept, ct);
        await _admin.SaveChangesAsync(ct);
        return Ok();
    }

    // ── Severity & Priority ──────────────────────────────────────────────────

    [HttpGet("severity-levels")]
    public async Task<IActionResult> GetSeverityLevels(CancellationToken ct) =>
        Ok((await _admin.GetSeverityLevelsAsync(ct)).Select(s => new
        {
            s.Id, s.Code, s.Label, s.Color, s.SlaHours, s.AutoEscalate
        }));

    [HttpPut("severity-levels/{id:guid}")]
    public async Task<IActionResult> UpdateSeverityLevel(Guid id, [FromBody] UpdateSeverityRequest req, CancellationToken ct)
    {
        var level = await _admin.FindSeverityLevelByIdAsync(id, ct);
        if (level is null) return NotFound();

        if (req.Label is not null) level.Label = req.Label;
        if (req.Color is not null) level.Color = req.Color;
        if (req.SlaHours.HasValue) level.SlaHours = req.SlaHours.Value;
        if (req.AutoEscalate.HasValue) level.AutoEscalate = req.AutoEscalate.Value;

        await _admin.SaveChangesAsync(ct);
        return Ok();
    }

    [HttpGet("priorities")]
    public async Task<IActionResult> GetPriorities(CancellationToken ct) =>
        Ok((await _admin.GetPriorityLevelsAsync(ct)).Select(p => new
        {
            p.Id, p.Code, p.Label, p.Color
        }));

    [HttpPut("priorities/{id:guid}")]
    public async Task<IActionResult> UpdatePriority(Guid id, [FromBody] UpdatePriorityRequest req, CancellationToken ct)
    {
        var priority = await _admin.FindPriorityLevelByIdAsync(id, ct);
        if (priority is null) return NotFound();

        if (req.Label is not null) priority.Label = req.Label;
        if (req.Color is not null) priority.Color = req.Color;

        await _admin.SaveChangesAsync(ct);
        return Ok();
    }

    // ── Factories & Lines ────────────────────────────────────────────────────

    [HttpGet("factories")]
    public async Task<IActionResult> GetFactories(CancellationToken ct) =>
        Ok((await _admin.GetFactoriesAsync(ct)).Select(f => new
        {
            f.Id, f.Name, f.Location, f.Active
        }));

    [HttpPut("factories/{id:guid}")]
    public async Task<IActionResult> UpdateFactory(Guid id, [FromBody] UpdateFactoryRequest req, CancellationToken ct)
    {
        var factory = await _admin.FindFactoryByIdAsync(id, ct);
        if (factory is null) return NotFound();

        if (req.Name is not null) factory.Name = req.Name;
        if (req.Location is not null) factory.Location = req.Location;
        if (req.Active.HasValue) factory.Active = req.Active.Value;

        await _admin.SaveChangesAsync(ct);
        return Ok();
    }

    [HttpGet("factories/{id:guid}/lines")]
    public async Task<IActionResult> GetFactoryLines(Guid id, CancellationToken ct)
    {
        if (await _admin.FindFactoryByIdAsync(id, ct) is null) return NotFound();
        var lines = await _admin.GetLinesByFactoryIdAsync(id, ct);
        return Ok(lines.Select(l => new { l.Id, l.Name, l.Active }));
    }

    [HttpPost("factories/{id:guid}/lines")]
    public async Task<IActionResult> AddFactoryLine(Guid id, [FromBody] CreateLineRequest req, CancellationToken ct)
    {
        if (await _admin.FindFactoryByIdAsync(id, ct) is null) return NotFound();

        var line = new ProductionLine
        {
            Id = Guid.NewGuid(),
            FactoryId = id,
            Name = req.Name,
            Active = req.Active ?? true
        };
        await _admin.AddProductionLineAsync(line, ct);
        await _admin.SaveChangesAsync(ct);
        return StatusCode(201, new { line.Id, line.Name });
    }

    // ── Notification Templates ───────────────────────────────────────────────

    [HttpGet("notification-templates")]
    public async Task<IActionResult> GetNotificationTemplates(CancellationToken ct) =>
        Ok((await _admin.GetNotificationTemplatesAsync(ct)).Select(t => new
        {
            t.Id,
            t.TriggerEvent,
            channels = ParseJsonArray(t.ChannelsJson),
            t.SubjectTemplate,
            t.BodyTemplate,
            t.Active
        }));

    [HttpPut("notification-templates/{id:guid}")]
    public async Task<IActionResult> UpdateNotificationTemplate(Guid id, [FromBody] UpdateTemplateRequest req, CancellationToken ct)
    {
        var template = await _admin.FindNotificationTemplateByIdAsync(id, ct);
        if (template is null) return NotFound();

        if (req.Channels is not null) template.ChannelsJson = SerializeJson(req.Channels);
        if (req.SubjectTemplate is not null) template.SubjectTemplate = req.SubjectTemplate;
        if (req.BodyTemplate is not null) template.BodyTemplate = req.BodyTemplate;
        if (req.Active.HasValue) template.Active = req.Active.Value;

        await _admin.SaveChangesAsync(ct);
        return Ok();
    }

    private static List<string> ParseJsonArray(string json)
    {
        try { return JsonSerializer.Deserialize<List<string>>(json, JsonOpts) ?? []; }
        catch { return []; }
    }

    private static string SerializeJson(IReadOnlyList<string> values) =>
        JsonSerializer.Serialize(values, JsonOpts);
}

public record CreateRoleRequest(string Code, string? Label, IReadOnlyList<string>? Permissions);
public record UpdateRoleRequest(string? Label, IReadOnlyList<string>? Permissions);
public record AssignRoleRequest(Guid RoleId);
public record CreateCategoryRequest(string Name, bool? Active, IReadOnlyList<string>? Subcategories);
public record UpdateCategoryRequest(string? Name, bool? Active, IReadOnlyList<string>? Subcategories);
public record SubcategoryRequest(string Name);
public record CreateDepartmentRequest(string Name, string? Manager, string? Location, bool? Active);
public record UpdateDepartmentRequest(string? Name, string? Manager, string? Location, bool? Active);
public record UpdateSeverityRequest(string? Label, string? Color, int? SlaHours, bool? AutoEscalate);
public record UpdatePriorityRequest(string? Label, string? Color);
public record UpdateFactoryRequest(string? Name, string? Location, bool? Active);
public record CreateLineRequest(string Name, bool? Active);
public record UpdateTemplateRequest(IReadOnlyList<string>? Channels, string? SubjectTemplate, string? BodyTemplate, bool? Active);
