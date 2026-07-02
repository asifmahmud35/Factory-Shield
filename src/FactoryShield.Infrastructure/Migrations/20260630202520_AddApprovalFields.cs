using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FactoryShield.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddApprovalFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "AssignedResolverId",
                table: "Incidents",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Decision",
                table: "Incidents",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RejectReason",
                table: "Incidents",
                type: "character varying(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Incidents_AssignedResolverId",
                table: "Incidents",
                column: "AssignedResolverId");

            migrationBuilder.AddForeignKey(
                name: "FK_Incidents_Users_AssignedResolverId",
                table: "Incidents",
                column: "AssignedResolverId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Incidents_Users_AssignedResolverId",
                table: "Incidents");

            migrationBuilder.DropIndex(
                name: "IX_Incidents_AssignedResolverId",
                table: "Incidents");

            migrationBuilder.DropColumn(
                name: "AssignedResolverId",
                table: "Incidents");

            migrationBuilder.DropColumn(
                name: "Decision",
                table: "Incidents");

            migrationBuilder.DropColumn(
                name: "RejectReason",
                table: "Incidents");
        }
    }
}
