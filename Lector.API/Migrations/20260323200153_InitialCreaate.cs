using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Lector.API.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreaate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Scans",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    Alias = table.Column<string>(type: "TEXT", maxLength: 255, nullable: false),
                    StorageName = table.Column<string>(type: "TEXT", maxLength: 128, nullable: false),
                    Hash = table.Column<string>(type: "TEXT", maxLength: 64, nullable: false),
                    OcrResult = table.Column<string>(type: "TEXT", nullable: true),
                    Status = table.Column<int>(type: "INTEGER", nullable: false),
                    ErrorMessage = table.Column<string>(type: "TEXT", nullable: true),
                    SizeBytes = table.Column<long>(type: "INTEGER", nullable: false),
                    ContentType = table.Column<string>(type: "TEXT", nullable: false),
                    ScanDurationMs = table.Column<int>(type: "INTEGER", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Scans", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Scans_CreatedAt",
                table: "Scans",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_Scans_Hash",
                table: "Scans",
                column: "Hash");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Scans");
        }
    }
}
