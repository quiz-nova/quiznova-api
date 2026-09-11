resource "github_actions_secret" "azure_client_id" {
  repository  = var.github_repository_name
  secret_name = "AZURE_CLIENT_ID"
  value       = azuread_application.quiznova_app.client_id
}

resource "github_actions_secret" "azure_tenant_id" {
  repository  = var.github_repository_name
  secret_name = "AZURE_TENANT_ID"
  value       = data.azurerm_client_config.current.tenant_id
}

resource "github_actions_secret" "azure_subscription_id" {
  repository  = var.github_repository_name
  secret_name = "AZURE_SUBSCRIPTION_ID"
  value       = var.azure_subscription_id
}
