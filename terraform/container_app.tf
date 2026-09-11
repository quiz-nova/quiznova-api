# Managed identity for Azure Container Apps to read secrets from Key Vault
resource "azurerm_user_assigned_identity" "aca" {
  name                = "quiznova-aca-identity"
  resource_group_name = azurerm_resource_group.app_rg.name
  location            = azurerm_resource_group.app_rg.location
}

# Azure Container App - Backend API
resource "azurerm_container_app" "backend_app" {
  name                         = "quiznova-api"
  container_app_environment_id = azurerm_container_app_environment.app_env.id
  resource_group_name          = azurerm_resource_group.app_rg.name
  revision_mode                = "Single"
  workload_profile_name        = "Consumption"

  identity {
    type         = "UserAssigned"
    identity_ids = [azurerm_user_assigned_identity.aca.id]
  }

  secret {
    name                = "db-connection-string"
    key_vault_secret_id = azurerm_key_vault_secret.db_connection.id
    identity            = azurerm_user_assigned_identity.aca.id
  }

  secret {
    name                = "jwt-secret"
    key_vault_secret_id = azurerm_key_vault_secret.jwt_secret.id
    identity            = azurerm_user_assigned_identity.aca.id
  }

  secret {
    name                = "mongodb-connection-string"
    key_vault_secret_id = azurerm_key_vault_secret.mongodb_connection.id
    identity            = azurerm_user_assigned_identity.aca.id
  }

  secret {
    name                = "grafana-loki-password"
    key_vault_secret_id = azurerm_key_vault_secret.grafana_loki_password.id
    identity            = azurerm_user_assigned_identity.aca.id
  }

  secret {
    name                = "grafana-otlp-auth-header"
    key_vault_secret_id = azurerm_key_vault_secret.grafana_otlp_auth.id
    identity            = azurerm_user_assigned_identity.aca.id
  }

  template {
    min_replicas = 0
    max_replicas = 1

    container {
      name   = "quiznova-api"
      image  = "ghcr.io/${var.github_owner}/quiznova-api:latest"
      cpu    = "0.5"
      memory = "1Gi"

      dynamic "env" {
        for_each = var.allowed_origins
        content {
          name  = "CorsSettings__AllowedOrigins__${env.key}"
          value = env.value
        }
      }

      env {
        name  = "JwtSettings__Issuer"
        value = "https://quiznova-api.purpleforest-454b82e9.swedencentral.azurecontainerapps.io"
      }
      env {
        name  = "JwtSettings__Audiences__0"
        value = "https://moamenelbarqy.github.io"
      }
      env {
        name  = "JwtSettings__Audiences__1"
        value = "https://quiznova.dev"
      }
      env {
        name  = "JwtSettings__Audiences__2"
        value = "https://www.quiznova.dev"
      }

      env {
        name  = "ASPNETCORE_ENVIRONMENT"
        value = "Production"
      }
      env {
        name  = "AutoMigrateDb"
        value = "true"
      }
      env {
        name        = "PostgresSettings__DefaultConnection"
        secret_name = "db-connection-string"
      }
      env {
        name  = "PostgresSettings__MaximumPoolSize"
        value = tostring(var.postgres_maximum_pool_size)
      }
      env {
        name  = "PostgresSettings__MinimumPoolSize"
        value = tostring(var.postgres_minimum_pool_size)
      }
      env {
        name  = "PostgresSettings__ConnectionTimeoutSeconds"
        value = tostring(var.postgres_connection_timeout_seconds)
      }
      env {
        name        = "MongoDbSettings__ConnectionString"
        secret_name = "mongodb-connection-string"
      }
      env {
        name  = "MongoDbSettings__DatabaseName"
        value = "quiznova-mongodb-prod"
      }
      env {
        name  = "MongoDbSettings__MaxConnectionPoolSize"
        value = tostring(var.mongodb_max_connection_pool_size)
      }
      env {
        name  = "MongoDbSettings__MinConnectionPoolSize"
        value = tostring(var.mongodb_min_connection_pool_size)
      }
      env {
        name  = "MongoDbSettings__MaxConnecting"
        value = tostring(var.mongodb_max_connecting)
      }
      env {
        name  = "MongoDbSettings__WaitQueueTimeoutMinutes"
        value = tostring(var.mongodb_wait_queue_timeout_minutes)
      }

      env {
        name  = "SERILOG__USING__0"
        value = "Serilog.Sinks.Grafana.Loki"
      }
      env {
        name  = "SERILOG__WRITETO__1__NAME"
        value = "GrafanaLoki"
      }
      env {
        name  = "SERILOG__WRITETO__1__ARGS__URI"
        value = var.grafana_loki_uri
      }
      env {
        name  = "SERILOG__WRITETO__1__ARGS__LABELS__0__KEY"
        value = "app"
      }
      env {
        name  = "SERILOG__WRITETO__1__ARGS__LABELS__0__VALUE"
        value = "QuizNova.Api"
      }
      env {
        name  = "SERILOG__WRITETO__1__ARGS__LABELS__1__KEY"
        value = "env"
      }
      env {
        name  = "SERILOG__WRITETO__1__ARGS__LABELS__1__VALUE"
        value = "production"
      }
      env {
        name        = "JwtSettings__Secret"
        secret_name = "jwt-secret"
      }
      env {
        name  = "SERILOG__WRITETO__1__ARGS__CREDENTIALS__LOGIN"
        value = var.grafana_loki_instance_id
      }
      env {
        name        = "SERILOG__WRITETO__1__ARGS__CREDENTIALS__PASSWORD"
        secret_name = "grafana-loki-password"
      }
      env {
        name  = "SERILOG__WRITETO__1__ARGS__PERIOD"
        value = "00:00:01"
      }
      env {
        name  = "SERILOG__WRITETO__1__ARGS__EAGERLYEMITFIRSTEVENT"
        value = "true"
      }
      env {
        name  = "OTEL_SERVICE_NAME"
        value = "QuizNova.Api"
      }
      env {
        name  = "OTEL_EXPORTER_OTLP_ENDPOINT"
        value = var.grafana_otlp_endpoint
      }
      env {
        name        = "OTEL_EXPORTER_OTLP_HEADERS"
        secret_name = "grafana-otlp-auth-header"
      }
      env {
        name  = "OTEL_EXPORTER_OTLP_PROTOCOL"
        value = "http/protobuf"
      }

      liveness_probe {
        interval_seconds = 30
        path             = "/healthz"
        port             = 8080
        transport        = "HTTP"
      }

      readiness_probe {
        interval_seconds = 15
        path             = "/healthz/ready"
        port             = 8080
        transport        = "HTTP"
      }

      startup_probe {
        interval_seconds        = 5
        failure_count_threshold = 10
        path                    = "/healthz/startup"
        port                    = 8080
        transport               = "HTTP"
      }
    }
  }

  ingress {
    allow_insecure_connections = false
    external_enabled           = true
    target_port                = 8080
    traffic_weight {
      percentage      = 100
      latest_revision = true
    }
  }

  # Ignore changes to container image when deployed by GitHub Actions CI/CD
  lifecycle {
    ignore_changes = [
      template[0].container[0].image
    ]
  }

  depends_on = [
    azurerm_key_vault_secret.db_connection,
    azurerm_key_vault_secret.jwt_secret,
    azurerm_key_vault_secret.mongodb_connection,
    azurerm_key_vault_secret.grafana_loki_password,
    azurerm_key_vault_secret.grafana_otlp_auth
  ]
}
