using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FactoryShield.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddIncidentFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Category",
                table: "Incidents",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Department",
                table: "Incidents",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "ReporterId",
                table: "Incidents",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Severity",
                table: "Incidents",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "ShortDescription",
                table: "Incidents",
                type: "character varying(500)",
                maxLength: 500,
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateIndex(
                name: "IX_Incidents_ReporterId",
                table: "Incidents",
                column: "ReporterId");

            migrationBuilder.AddForeignKey(
                name: "FK_Incidents_Users_ReporterId",
                table: "Incidents",
                column: "ReporterId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Incidents_Users_ReporterId",
                table: "Incidents");

            migrationBuilder.DropIndex(
                name: "IX_Incidents_ReporterId",
                table: "Incidents");

            migrationBuilder.DropColumn(
                name: "Category",
                table: "Incidents");

            migrationBuilder.DropColumn(
                name: "Department",
                table: "Incidents");

            migrationBuilder.DropColumn(
                name: "ReporterId",
                table: "Incidents");

            migrationBuilder.DropColumn(
                name: "Severity",
                table: "Incidents");

            migrationBuilder.DropColumn(
                name: "ShortDescription",
                table: "Incidents");
        }
    }
}
