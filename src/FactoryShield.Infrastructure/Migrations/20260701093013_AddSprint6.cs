using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FactoryShield.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddSprint6 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "AccumulatedPauseMinutes",
                table: "SlaClocks",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<DateTime>(
                name: "PausedAt",
                table: "SlaClocks",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "LoopGuardTriggered",
                table: "Incidents",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<Guid>(
                name: "MergedIntoId",
                table: "Incidents",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "RouteCount",
                table: "Incidents",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "IncidentClaims",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    IncidentId = table.Column<Guid>(type: "uuid", nullable: false),
                    ClaimedById = table.Column<Guid>(type: "uuid", nullable: false),
                    ClaimedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_IncidentClaims", x => x.Id);
                    table.ForeignKey(
                        name: "FK_IncidentClaims_Incidents_IncidentId",
                        column: x => x.IncidentId,
                        principalTable: "Incidents",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_IncidentClaims_Users_ClaimedById",
                        column: x => x.ClaimedById,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "IncidentRoutingLogs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    IncidentId = table.Column<Guid>(type: "uuid", nullable: false),
                    PreviousCategory = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    NewCategory = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    PreviousSeverity = table.Column<int>(type: "integer", nullable: false),
                    NewSeverity = table.Column<int>(type: "integer", nullable: false),
                    ChangedById = table.Column<Guid>(type: "uuid", nullable: false),
                    Reason = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    ChangedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_IncidentRoutingLogs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_IncidentRoutingLogs_Incidents_IncidentId",
                        column: x => x.IncidentId,
                        principalTable: "Incidents",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_IncidentRoutingLogs_Users_ChangedById",
                        column: x => x.ChangedById,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Incidents_MergedIntoId",
                table: "Incidents",
                column: "MergedIntoId");

            migrationBuilder.CreateIndex(
                name: "IX_IncidentClaims_ClaimedById",
                table: "IncidentClaims",
                column: "ClaimedById");

            migrationBuilder.CreateIndex(
                name: "IX_IncidentClaims_IncidentId_IsActive",
                table: "IncidentClaims",
                columns: new[] { "IncidentId", "IsActive" },
                unique: true,
                filter: "\"IsActive\" = true");

            migrationBuilder.CreateIndex(
                name: "IX_IncidentRoutingLogs_ChangedById",
                table: "IncidentRoutingLogs",
                column: "ChangedById");

            migrationBuilder.CreateIndex(
                name: "IX_IncidentRoutingLogs_IncidentId",
                table: "IncidentRoutingLogs",
                column: "IncidentId");

            migrationBuilder.AddForeignKey(
                name: "FK_Incidents_Incidents_MergedIntoId",
                table: "Incidents",
                column: "MergedIntoId",
                principalTable: "Incidents",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Incidents_Incidents_MergedIntoId",
                table: "Incidents");

            migrationBuilder.DropTable(
                name: "IncidentClaims");

            migrationBuilder.DropTable(
                name: "IncidentRoutingLogs");

            migrationBuilder.DropIndex(
                name: "IX_Incidents_MergedIntoId",
                table: "Incidents");

            migrationBuilder.DropColumn(
                name: "AccumulatedPauseMinutes",
                table: "SlaClocks");

            migrationBuilder.DropColumn(
                name: "PausedAt",
                table: "SlaClocks");

            migrationBuilder.DropColumn(
                name: "LoopGuardTriggered",
                table: "Incidents");

            migrationBuilder.DropColumn(
                name: "MergedIntoId",
                table: "Incidents");

            migrationBuilder.DropColumn(
                name: "RouteCount",
                table: "Incidents");
        }
    }
}
