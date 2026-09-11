resource "azurerm_key_vault" "main" {
  name                       = "quiznova-kv"
  resource_group_name        = azurerm_resource_group.app_rg.name
  location                   = azurerm_resource_group.app_rg.location
  tenant_id                  = data.azurerm_client_config.current.tenant_id
  sku_name                   = "standard"
  soft_delete_retention_days = 7
  purge_protection_enabled   = true

  access_policy {
    tenant_id          = data.azurerm_client_config.current.tenant_id
    object_id          = data.azurerm_client_config.current.object_id
    secret_permissions = ["Get", "List", "Set", "Delete", "Purge", "Recover", "Backup", "Restore"]
  }

  access_policy {
    tenant_id          = data.azurerm_client_config.current.tenant_id
    object_id          = azurerm_user_assigned_identity.aca.principal_id
    secret_permissions = ["Get", "List"]
  }
}

# Key Vault Secrets
resource "azurerm_key_vault_secret" "db_connection" {
  name         = "db-connection-string"
  value        = var.db_connection_string
  key_vault_id = azurerm_key_vault.main.id
}

resource "azurerm_key_vault_secret" "jwt_secret" {
  name         = "jwt-secret"
  value        = var.jwt_secret
  key_vault_id = azurerm_key_vault.main.id
}

resource "azurerm_key_vault_secret" "mongodb_connection" {
  name         = "mongodb-connection-string"
  value        = var.mongodb_connection_string
  key_vault_id = azurerm_key_vault.main.id
}

resource "azurerm_key_vault_secret" "grafana_loki_password" {
  name         = "grafana-loki-password"
  value        = var.grafana_loki_password
  key_vault_id = azurerm_key_vault.main.id
}

resource "azurerm_key_vault_secret" "grafana_otlp_auth" {
  name         = "grafana-otlp-auth-header"
  value        = "Authorization=Basic ${var.grafana_otlp_auth_header}"
  key_vault_id = azurerm_key_vault.main.id
}
