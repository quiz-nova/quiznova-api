# Azure Container App - Backend API
resource "azurerm_container_app" "backend_app" {
  name                         = "quiznova-api-${var.environment_name}"
  container_app_environment_id = azurerm_container_app_environment.app_env.id
  resource_group_name          = var.resource_group_name
  revision_mode                = "Single"
  workload_profile_name        = "Consumption"

  identity {
    type         = "UserAssigned"
    identity_ids = [azurerm_user_assigned_identity.aca.id]
  }

  secret {
    name  = "db-connection-string"
    value = azurerm_key_vault_secret.db_connection.value
  }

  secret {
    name  = "jwt-secret"
    value = azurerm_key_vault_secret.jwt_secret.value
  }

  secret {
    name  = "mongodb-connection-string"
    value = azurerm_key_vault_secret.mongodb_connection.value
  }

  secret {
    name  = "datadog-api-key"
    value = azurerm_key_vault_secret.datadog_api_key.value
  }

  secret {
    name  = "ghcr-token"
    value = azurerm_key_vault_secret.ghcr_token.value
  }

  registry {
    server               = "ghcr.io"
    username             = var.ghcr_username
    password_secret_name = "ghcr-token"
  }

  template {
    min_replicas = var.min_replicas
    max_replicas = var.max_replicas

    container {
      name   = "quiznova-api"
      image  = "ghcr.io/${var.github_owner}/quiznova-api:latest"
      cpu    = var.cpu
      memory = var.memory

      dynamic "env" {
        for_each = var.allowed_origins
        content {
          name  = "CorsSettings__AllowedOrigins__${env.key}"
          value = env.value
        }
      }

      env {
        name  = "JwtSettings__Issuer"
        value = "QuizNova.Api"
      }

      dynamic "env" {
        for_each = var.allowed_origins
        content {
          name  = "JwtSettings__Audiences__${env.key}"
          value = env.value
        }
      }

      env {
        name  = "ASPNETCORE_ENVIRONMENT"
        value = var.environment_name == "dev" ? "Development" : (var.environment_name == "stg" ? "Staging" : "Production")
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
        value = "quiznova-mongodb-${var.environment_name}"
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
        name        = "JwtSettings__Secret"
        secret_name = "jwt-secret"
      }
      env {
        name  = "OTEL_SERVICE_NAME"
        value = "quiznova-api"
      }
      env {
        name  = "OTEL_RESOURCE_ATTRIBUTES"
        value = "deployment.environment=${var.environment_name},version=1.0.0"
      }
      env {
        name  = "OTEL_EXPORTER_OTLP_ENDPOINT"
        value = "https://otlp.us5.datadoghq.com"
      }
      env {
        name        = "OTEL_EXPORTER_OTLP_HEADERS"
        secret_name = "datadog-api-key"
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
    azurerm_key_vault_secret.datadog_api_key,
    azurerm_key_vault_secret.ghcr_token
  ]
}
