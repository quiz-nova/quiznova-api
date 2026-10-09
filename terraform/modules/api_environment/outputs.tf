output "container_app_name" {
  description = "Name of the Container App"
  value       = azurerm_container_app.backend_app.name
}

output "container_app_fqdn" {
  description = "FQDN of the Container App"
  value       = azurerm_container_app.backend_app.ingress[0].fqdn
}

output "container_app_id" {
  description = "Resource ID of the Container App"
  value       = azurerm_container_app.backend_app.id
}

output "key_vault_id" {
  description = "Resource ID of the Key Vault"
  value       = azurerm_key_vault.main.id
}

output "key_vault_uri" {
  description = "URI of the Key Vault"
  value       = azurerm_key_vault.main.vault_uri
}

output "azure_client_id" {
  description = "Client ID for GitHub Actions OIDC"
  value       = azuread_application.quiznova_app.client_id
}
