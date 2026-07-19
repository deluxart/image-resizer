# Build context is the REPOSITORY ROOT (Render's default), so paths are
# relative to the repo, e.g. Api/Api.csproj.

# --- Build stage ---
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Restore first (cached layer when only source changes).
COPY Api/Api.csproj Api/
RUN dotnet restore Api/Api.csproj

COPY Api/ Api/
RUN dotnet publish Api/Api.csproj -c Release -o /app --no-restore

# --- Runtime stage (small image, no SDK) ---
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
COPY --from=build /app .

# Don't watch appsettings.json for changes in production. The default file
# watcher uses inotify, whose instance limit is easily hit on constrained
# hosts (Render) and crashes startup. Config is static in prod anyway.
ENV DOTNET_hostBuilder__reloadConfigOnChange=false

EXPOSE 8080

# Render (and most PaaS) inject the port via $PORT at runtime; bind to it,
# falling back to 8080 for local `docker run`.
ENTRYPOINT ["sh", "-c", "ASPNETCORE_URLS=http://+:${PORT:-8080} dotnet Api.dll"]
