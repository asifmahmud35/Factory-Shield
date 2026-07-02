using System.Text;
using FactoryShield.Application.Analytics.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FactoryShield.Api.Controllers;

[ApiController]
[Route("api/v1/analytics")]
[Authorize(Policy = "GovernanceOnly")]
public class AnalyticsController : ControllerBase
{
    private readonly IMediator _mediator;

    public AnalyticsController(IMediator mediator) => _mediator = mediator;

    [HttpGet("kpi")]
    public async Task<IActionResult> GetKpi([FromQuery] string period = "6m", CancellationToken ct = default) =>
        Ok(await _mediator.Send(new GetAnalyticsKpiQuery(period), ct));

    [HttpGet("incident-trend")]
    public async Task<IActionResult> GetIncidentTrend([FromQuery] string period = "6m", CancellationToken ct = default) =>
        Ok(await _mediator.Send(new GetIncidentTrendQuery(period), ct));

    [HttpGet("department-performance")]
    public async Task<IActionResult> GetDepartmentPerformance([FromQuery] string period = "6m", CancellationToken ct = default) =>
        Ok(await _mediator.Send(new GetDepartmentPerformanceQuery(period), ct));

    [HttpGet("severity-distribution")]
    public async Task<IActionResult> GetSeverityDistribution([FromQuery] string period = "6m", CancellationToken ct = default) =>
        Ok(await _mediator.Send(new GetSeverityDistributionQuery(period), ct));

    [HttpGet("recurring-issues")]
    public async Task<IActionResult> GetRecurringIssues([FromQuery] string period = "6m", CancellationToken ct = default) =>
        Ok(await _mediator.Send(new GetRecurringIssuesQuery(period), ct));

    [HttpGet("root-cause-distribution")]
    public async Task<IActionResult> GetRootCauseDistribution([FromQuery] string period = "6m", CancellationToken ct = default) =>
        Ok(await _mediator.Send(new GetRootCauseDistributionQuery(period), ct));

    [HttpGet("closure-rate")]
    public async Task<IActionResult> GetClosureRate([FromQuery] string period = "6m", CancellationToken ct = default) =>
        Ok(await _mediator.Send(new GetClosureRateQuery(period), ct));

    [HttpGet("resolution-time")]
    public async Task<IActionResult> GetResolutionTime([FromQuery] string period = "6m", CancellationToken ct = default) =>
        Ok(await _mediator.Send(new GetResolutionTimeBreakdownQuery(period), ct));

    [HttpGet("export/pdf")]
    public async Task<IActionResult> ExportPdf([FromQuery] string period = "6m", CancellationToken ct = default)
    {
        var data = await _mediator.Send(new GetAnalyticsExportQuery(period, "pdf"), ct);
        var text = BuildExportText(data);
        var pdfBytes = BuildSimplePdf(text);
        return File(pdfBytes, "application/pdf", $"analytics-{period}.pdf");
    }

    [HttpGet("export/excel")]
    public async Task<IActionResult> ExportExcel([FromQuery] string period = "6m", CancellationToken ct = default)
    {
        var data = await _mediator.Send(new GetAnalyticsExportQuery(period, "excel"), ct);
        var csv = BuildCsv(data);
        return File(Encoding.UTF8.GetBytes(csv), "text/csv", $"analytics-{period}.csv");
    }

    private static string BuildExportText(FactoryShield.Application.Analytics.Models.AnalyticsExportDataDto data)
    {
        var sb = new StringBuilder();
        sb.AppendLine("FactoryShield Analytics Report");
        sb.AppendLine($"Period: {data.Kpi.Period}");
        sb.AppendLine($"Total Incidents: {data.Kpi.TotalIncidents}");
        sb.AppendLine($"Avg Resolution Hours: {data.Kpi.AvgResolutionHours}");
        sb.AppendLine($"SLA Compliance: {data.Kpi.SlaCompliancePct}%");
        sb.AppendLine($"Recurring Rate: {data.Kpi.RecurringRatePct}%");
        return sb.ToString();
    }

    private static string BuildCsv(FactoryShield.Application.Analytics.Models.AnalyticsExportDataDto data)
    {
        var sb = new StringBuilder();
        sb.AppendLine("Metric,Value");
        sb.AppendLine($"Total Incidents,{data.Kpi.TotalIncidents}");
        sb.AppendLine($"Avg Resolution Hours,{data.Kpi.AvgResolutionHours}");
        sb.AppendLine($"SLA Compliance %,{data.Kpi.SlaCompliancePct}");
        sb.AppendLine($"Recurring Rate %,{data.Kpi.RecurringRatePct}");
        sb.AppendLine();
        sb.AppendLine("Month,Reported");
        foreach (var point in data.Trend)
            sb.AppendLine($"{point.Month},{point.Reported}");
        sb.AppendLine();
        sb.AppendLine("Department,Incidents,Resolved");
        foreach (var dept in data.Departments)
            sb.AppendLine($"{dept.Dept},{dept.Incidents},{dept.Resolved}");
        return sb.ToString();
    }

    private static byte[] BuildSimplePdf(string text)
    {
        var escaped = text.Replace("\\", "\\\\").Replace("(", "\\(").Replace(")", "\\)");
        var lines = escaped.Split('\n').Select(l => l.TrimEnd('\r'));
        var content = new StringBuilder();
        content.AppendLine("BT /F1 12 Tf 50 750 Td 14 TL");
        var first = true;
        foreach (var line in lines)
        {
            if (first)
            {
                content.AppendLine($"({line}) Tj");
                first = false;
            }
            else
            {
                content.AppendLine("T*");
                content.AppendLine($"({line}) Tj");
            }
        }
        content.AppendLine("ET");

        var stream = content.ToString();
        var pdf = $"""
            %PDF-1.4
            1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
            2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
            3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj
            4 0 obj<</Length {Encoding.UTF8.GetByteCount(stream)}>>stream
            {stream}
            endstream endobj
            5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj
            xref
            0 6
            0000000000 65535 f 
            trailer<</Size 6/Root 1 0 R>>
            startxref
            500
            %%EOF
            """;
        return Encoding.UTF8.GetBytes(pdf);
    }
}
