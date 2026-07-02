using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FactoryShield.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddInvestigationStatus : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "RootCauseCode",
                table: "Investigations",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "InvestigationCompletedAt",
                table: "Investigations",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "InvestigationStatus",
                table: "Investigations",
                type: "character varying(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "IN_PROGRESS");

            migrationBuilder.AddColumn<string>(
                name: "RootCauseDescription",
                table: "Investigations",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "InvestigationCompletedAt",
                table: "Investigations");

            migrationBuilder.DropColumn(
                name: "InvestigationStatus",
                table: "Investigations");

            migrationBuilder.DropColumn(
                name: "RootCauseDescription",
                table: "Investigations");

            migrationBuilder.AlterColumn<string>(
                name: "RootCauseCode",
                table: "Investigations",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(50)",
                oldMaxLength: 50,
                oldNullable: true);
        }
    }
}
