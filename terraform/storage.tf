# Azure Storage Account for centralized Terraform state and future storage needs
resource "azurerm_storage_account" "state" {
  name                            = "stquiznova"
  resource_group_name             = azurerm_resource_group.app_rg.name
  location                        = azurerm_resource_group.app_rg.location
  account_tier                    = "Standard"
  account_replication_type        = "LRS"
  min_tls_version                 = "TLS1_2"
  allow_nested_items_to_be_public = false

  blob_properties {
    versioning_enabled = true
  }

  lifecycle {
    prevent_destroy = true
  }
}

# Dedicated blob container for quiznova-api Terraform state
resource "azurerm_storage_container" "api_tfstate" {
  name                  = "quiznova-api-tfstate"
  storage_account_name  = azurerm_storage_account.state.name
  container_access_type = "private"

  lifecycle {
    prevent_destroy = true
  }
}

# Grant current user Storage Blob Data Contributor for state locking & management
resource "azurerm_role_assignment" "current_user_blob" {
  scope                = azurerm_storage_account.state.id
  role_definition_name = "Storage Blob Data Contributor"
  principal_id         = data.azurerm_client_config.current.object_id
}

# Grant GitHub Actions service principal Storage Blob Data Contributor
resource "azurerm_role_assignment" "sp_blob" {
  scope                = azurerm_storage_account.state.id
  role_definition_name = "Storage Blob Data Contributor"
  principal_id         = azuread_service_principal.quiznova_sp.object_id
}
