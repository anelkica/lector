using Lector.API.Data;
using Lector.API.Services;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.EntityFrameworkCore;
using Scalar.AspNetCore;

WebApplicationBuilder builder = WebApplication.CreateBuilder(args);

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReact", policy =>
    {
        policy.WithOrigins("http://localhost:5173")
            .AllowAnyMethod()
            .AllowAnyHeader();
    });
});

// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddControllers();
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection"))
);
builder.Services.AddOpenApi();
builder.Services.AddSingleton<IScannerService, ScannerService>();
builder.Services.Configure<FormOptions>(o => o.MultipartBodyLengthLimit = 35 * 1024 * 1024); // 35 mb limit ez

string uploadsFolder = Path.Combine(AppContext.BaseDirectory, "uploads");
Directory.CreateDirectory(uploadsFolder);

WebApplication app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference();
}

app.UseCors("AllowReact"); // I FORGOT TO REGISTER IT SMH
app.UseAuthorization();
app.MapControllers();
app.Run();
