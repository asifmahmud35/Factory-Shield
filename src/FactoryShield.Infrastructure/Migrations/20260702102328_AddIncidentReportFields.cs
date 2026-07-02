using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FactoryShield.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddIncidentReportFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AiSummary",
                table: "Incidents",
                type: "character varying(2000)",
                maxLength: 2000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Building",
                table: "Incidents",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Buyer",
                table: "Incidents",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ClassificationCategory",
                table: "Incidents",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ContactNumber",
                table: "Incidents",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "EmployeeId",
                table: "Incidents",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Equipment",
                table: "Incidents",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ExactLocation",
                table: "Incidents",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Factory",
                table: "Incidents",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Floor",
                table: "Incidents",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "GpsCoordinates",
                table: "Incidents",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ImmediateActionTaken",
                table: "Incidents",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "IncidentOccurredAt",
                table: "Incidents",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ProductionOrder",
                table: "Incidents",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ReporterDepartment",
                table: "Incidents",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ReporterName",
                table: "Incidents",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "StyleNumber",
                table: "Incidents",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SubCategory",
                table: "Incidents",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Witnesses",
                table: "Incidents",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AiSummary",
                table: "Incidents");

            migrationBuilder.DropColumn(
                name: "Building",
                table: "Incidents");

            migrationBuilder.DropColumn(
                name: "Buyer",
                table: "Incidents");

            migrationBuilder.DropColumn(
                name: "ClassificationCategory",
                table: "Incidents");

            migrationBuilder.DropColumn(
                name: "ContactNumber",
                table: "Incidents");

            migrationBuilder.DropColumn(
                name: "EmployeeId",
                table: "Incidents");

            migrationBuilder.DropColumn(
                name: "Equipment",
                table: "Incidents");

            migrationBuilder.DropColumn(
                name: "ExactLocation",
                table: "Incidents");

            migrationBuilder.DropColumn(
                name: "Factory",
                table: "Incidents");

            migrationBuilder.DropColumn(
                name: "Floor",
                table: "Incidents");

            migrationBuilder.DropColumn(
                name: "GpsCoordinates",
                table: "Incidents");

            migrationBuilder.DropColumn(
                name: "ImmediateActionTaken",
                table: "Incidents");

            migrationBuilder.DropColumn(
                name: "IncidentOccurredAt",
                table: "Incidents");

            migrationBuilder.DropColumn(
                name: "ProductionOrder",
                table: "Incidents");

            migrationBuilder.DropColumn(
                name: "ReporterDepartment",
                table: "Incidents");

            migrationBuilder.DropColumn(
                name: "ReporterName",
                table: "Incidents");

            migrationBuilder.DropColumn(
                name: "StyleNumber",
                table: "Incidents");

            migrationBuilder.DropColumn(
                name: "SubCategory",
                table: "Incidents");

            migrationBuilder.DropColumn(
                name: "Witnesses",
                table: "Incidents");
        }
    }
}
