using Lector.API.Services;
using Microsoft.AspNetCore.Http.Features;
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
builder.Services.AddOpenApi();
builder.Services.AddSingleton<IScannerService, ScannerService>();
builder.Services.Configure<FormOptions>(o => o.MultipartBodyLengthLimit = 35 * 1024 * 1024);

string uploadsFolder = Path.Combine(AppContext.BaseDirectory, "uploads");
Directory.CreateDirectory(uploadsFolder);

WebApplication app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference();
}

app.UseAuthorization();
app.MapControllers();
app.Run();
