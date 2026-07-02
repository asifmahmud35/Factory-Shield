using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FactoryShield.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddSprint9 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Notifications_Incidents_IncidentId",
                table: "Notifications");

            migrationBuilder.AlterColumn<Guid>(
                name: "IncidentId",
                table: "Notifications",
                type: "uuid",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uuid");

            migrationBuilder.AddColumn<string>(
                name: "Body",
                table: "Notifications",
                type: "character varying(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Channel",
                table: "Notifications",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "RecipientId",
                table: "Notifications",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RecipientRole",
                table: "Notifications",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "SentAt",
                table: "Notifications",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Subject",
                table: "Notifications",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ManualOverrideReason",
                table: "Incidents",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "QrCodeId",
                table: "Incidents",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SourceChannel",
                table: "Incidents",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "manual");

            migrationBuilder.CreateTable(
                name: "OfflineDrafts",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    LocalDraftId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    ServerIncidentId = table.Column<Guid>(type: "uuid", nullable: true),
                    ReporterId = table.Column<Guid>(type: "uuid", nullable: false),
                    PayloadJson = table.Column<string>(type: "text", nullable: false),
                    PayloadHash = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    SyncStatus = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false, defaultValue: "Queued"),
                    SyncAttemptCount = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    AlertSentCount = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    LocalEventTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ServerReceivedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    SyncErrorMessage = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OfflineDrafts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_OfflineDrafts_Users_ReporterId",
                        column: x => x.ReporterId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "QrCodes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Code = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    QrType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    FactoryId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    SectionId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    LineId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    MachineId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Label = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    CreatedById = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    DeactivatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DeactivatedById = table.Column<Guid>(type: "uuid", nullable: true),
                    ScanCount = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    LastScannedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_QrCodes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_QrCodes_Users_CreatedById",
                        column: x => x.CreatedById,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Incidents_QrCodeId",
                table: "Incidents",
                column: "QrCodeId");

            migrationBuilder.CreateIndex(
                name: "IX_OfflineDrafts_LocalDraftId",
                table: "OfflineDrafts",
                column: "LocalDraftId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_OfflineDrafts_ReporterId_PayloadHash",
                table: "OfflineDrafts",
                columns: new[] { "ReporterId", "PayloadHash" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_QrCodes_Code",
                table: "QrCodes",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_QrCodes_CreatedById",
                table: "QrCodes",
                column: "CreatedById");

            migrationBuilder.AddForeignKey(
                name: "FK_Incidents_QrCodes_QrCodeId",
                table: "Incidents",
                column: "QrCodeId",
                principalTable: "QrCodes",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_Notifications_Incidents_IncidentId",
                table: "Notifications",
                column: "IncidentId",
                principalTable: "Incidents",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Incidents_QrCodes_QrCodeId",
                table: "Incidents");

            migrationBuilder.DropForeignKey(
                name: "FK_Notifications_Incidents_IncidentId",
                table: "Notifications");

            migrationBuilder.DropTable(
                name: "OfflineDrafts");

            migrationBuilder.DropTable(
                name: "QrCodes");

            migrationBuilder.DropIndex(
                name: "IX_Incidents_QrCodeId",
                table: "Incidents");

            migrationBuilder.DropColumn(
                name: "Body",
                table: "Notifications");

            migrationBuilder.DropColumn(
                name: "Channel",
                table: "Notifications");

            migrationBuilder.DropColumn(
                name: "RecipientId",
                table: "Notifications");

            migrationBuilder.DropColumn(
                name: "RecipientRole",
                table: "Notifications");

            migrationBuilder.DropColumn(
                name: "SentAt",
                table: "Notifications");

            migrationBuilder.DropColumn(
                name: "Subject",
                table: "Notifications");

            migrationBuilder.DropColumn(
                name: "ManualOverrideReason",
                table: "Incidents");

            migrationBuilder.DropColumn(
                name: "QrCodeId",
                table: "Incidents");

            migrationBuilder.DropColumn(
                name: "SourceChannel",
                table: "Incidents");

            migrationBuilder.AlterColumn<Guid>(
                name: "IncidentId",
                table: "Notifications",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldNullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Notifications_Incidents_IncidentId",
                table: "Notifications",
                column: "IncidentId",
                principalTable: "Incidents",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
