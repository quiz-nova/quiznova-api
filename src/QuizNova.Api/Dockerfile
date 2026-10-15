FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build

USER app
WORKDIR /src

COPY --chown=app:app ["Directory.Build.props", "."]
COPY --chown=app:app ["Directory.Packages.props", "."]
COPY --chown=app:app ["QuizNova.slnx", "."]

COPY --chown=app:app ["src/QuizNova.Api/QuizNova.Api.csproj", "src/QuizNova.Api/"]
COPY --chown=app:app ["src/QuizNova.Application/QuizNova.Application.csproj", "src/QuizNova.Application/"]
COPY --chown=app:app ["src/QuizNova.Domain/QuizNova.Domain.csproj", "src/QuizNova.Domain/"]
COPY --chown=app:app ["src/QuizNova.Infrastructure/QuizNova.Infrastructure.csproj", "src/QuizNova.Infrastructure/"]

RUN dotnet restore "src/QuizNova.Api/QuizNova.Api.csproj"

COPY --chown=app:app . .

RUN dotnet publish "src/QuizNova.Api/QuizNova.Api.csproj" \
  -c Release \
  -o ./publish \
  /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app

LABEL org.opencontainers.image.title="quiznova-api" \
  org.opencontainers.image.description="QuizNova Backend REST & SignalR API" \
  org.opencontainers.image.url="https://quiznova.dev" \
  org.opencontainers.image.source="https://github.com/quiz-nova/quiznova-api" \
  org.opencontainers.image.vendor="QuizNova" \
  org.opencontainers.image.licenses="All rights reserved"

USER root
RUN apt-get update \
  && apt-get install -y --no-install-recommends libgssapi-krb5-2 \
  && rm -rf /var/lib/apt/lists/*

USER app

ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production

EXPOSE 8080

COPY --from=build /src/publish .

ENTRYPOINT ["dotnet", "QuizNova.Api.dll"]