using Api.Configuration;
using Api.Middleware;
using Api.Services;
using Api.Validation;
using Microsoft.AspNetCore.Http.Timeouts;

var builder = WebApplication.CreateBuilder(args);

// --- Configuration: bind + validate the resize options on startup. ---
builder.Services
    .AddOptions<ResizeOptions>()
    .Bind(builder.Configuration.GetSection(ResizeOptions.SectionName))
    .ValidateDataAnnotations()
    .ValidateOnStart();

var resizeConfig = builder.Configuration
    .GetSection(ResizeOptions.SectionName)
    .Get<ResizeOptions>() ?? new ResizeOptions();

var allowedOrigins = builder.Configuration
    .GetSection("Cors:AllowedOrigins")
    .Get<string[]>() ?? [];

// --- Services (DI). ---
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Singleton: the resizer owns the concurrency semaphore, which must be shared
// across every request for the limit to mean anything.
builder.Services.AddSingleton<IImageResizeService, ImageResizeService>();
// Stateless — a single shared instance is enough.
builder.Services.AddSingleton<ImageUploadValidator>();

// Enforce the assignment's per-request timeout (default 30s).
builder.Services.AddRequestTimeouts(options =>
    options.DefaultPolicy = new RequestTimeoutPolicy
    {
        Timeout = TimeSpan.FromSeconds(resizeConfig.RequestTimeoutSeconds),
    });

builder.Services.AddCors(options =>
    options.AddDefaultPolicy(policy => policy
        .WithOrigins(allowedOrigins)
        .AllowAnyHeader()
        .AllowAnyMethod()));

var app = builder.Build();

// --- HTTP pipeline. Order matters. ---
app.UseMiddleware<ExceptionHandlingMiddleware>(); // outermost: catch everything below

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors();
app.UseRequestTimeouts();
app.MapControllers();

app.Run();
