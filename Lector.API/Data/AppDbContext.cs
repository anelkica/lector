using Lector.API.Models;
using Microsoft.EntityFrameworkCore;

namespace Lector.API.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Scan> Scans => Set<Scan>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Scan>().HasIndex(scan => scan.Hash);
        modelBuilder.Entity<Scan>().HasIndex(scan => scan.CreatedAt);
    }
}
