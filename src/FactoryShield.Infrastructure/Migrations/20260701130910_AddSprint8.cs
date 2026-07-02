using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FactoryShield.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddSprint8 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "AnonymousReferenceToken",
                table: "Incidents",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ReporterVisibility",
                table: "Incidents",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "visible");

            migrationBuilder.AddColumn<string>(
                name: "ReportingMode",
                table: "Incidents",
                type: "character varying(30)",
                maxLength: 30,
                nullable: false,
                defaultValue: "normal");

            migrationBuilder.CreateTable(
                name: "IdentityAccessAudits",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    IncidentId = table.Column<Guid>(type: "uuid", nullable: false),
                    AccessedById = table.Column<Guid>(type: "uuid", nullable: false),
                    AccessedByRole = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Reason = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    AccessedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_IdentityAccessAudits", x => x.Id);
                    table.ForeignKey(
                        name: "FK_IdentityAccessAudits_Incidents_IncidentId",
                        column: x => x.IncidentId,
                        principalTable: "Incidents",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_IdentityAccessAudits_Users_AccessedById",
                        column: x => x.AccessedById,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "IncidentStateLogs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    IncidentId = table.Column<Guid>(type: "uuid", nullable: false),
                    EventType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    FromStatus = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    ToStatus = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    ActorId = table.Column<Guid>(type: "uuid", nullable: true),
                    ActorRole = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    PreviousValue = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    NewValue = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    VisibilityScope = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false, defaultValue: "INTERNAL"),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_IncidentStateLogs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_IncidentStateLogs_Incidents_IncidentId",
                        column: x => x.IncidentId,
                        principalTable: "Incidents",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_IncidentStateLogs_Users_ActorId",
                        column: x => x.ActorId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_IdentityAccessAudits_AccessedById",
                table: "IdentityAccessAudits",
                column: "AccessedById");

            migrationBuilder.CreateIndex(
                name: "IX_IdentityAccessAudits_IncidentId_AccessedAt",
                table: "IdentityAccessAudits",
                columns: new[] { "IncidentId", "AccessedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_IncidentStateLogs_ActorId",
                table: "IncidentStateLogs",
                column: "ActorId");

            migrationBuilder.CreateIndex(
                name: "IX_IncidentStateLogs_IncidentId_CreatedAt",
                table: "IncidentStateLogs",
                columns: new[] { "IncidentId", "CreatedAt" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "IdentityAccessAudits");

            migrationBuilder.DropTable(
                name: "IncidentStateLogs");

            migrationBuilder.DropColumn(
                name: "AnonymousReferenceToken",
                table: "Incidents");

            migrationBuilder.DropColumn(
                name: "ReporterVisibility",
                table: "Incidents");

            migrationBuilder.DropColumn(
                name: "ReportingMode",
                table: "Incidents");
        }
    }
}
