using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FactoryShield.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddEscalationLifecycle : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "AcknowledgedAt",
                table: "Escalations",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "EscalatedToId",
                table: "Escalations",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Resolution",
                table: "Escalations",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "OPEN");

            migrationBuilder.CreateIndex(
                name: "IX_Escalations_EscalatedToId",
                table: "Escalations",
                column: "EscalatedToId");

            migrationBuilder.AddForeignKey(
                name: "FK_Escalations_Users_EscalatedToId",
                table: "Escalations",
                column: "EscalatedToId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Escalations_Users_EscalatedToId",
                table: "Escalations");

            migrationBuilder.DropIndex(
                name: "IX_Escalations_EscalatedToId",
                table: "Escalations");

            migrationBuilder.DropColumn(
                name: "AcknowledgedAt",
                table: "Escalations");

            migrationBuilder.DropColumn(
                name: "EscalatedToId",
                table: "Escalations");

            migrationBuilder.DropColumn(
                name: "Resolution",
                table: "Escalations");
        }
    }
}
