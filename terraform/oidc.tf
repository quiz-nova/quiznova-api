resource "azuread_application" "quiznova_app" {
  display_name = "github-actions-quiz-nova"
}

resource "azuread_service_principal" "quiznova_sp" {
  client_id = azuread_application.quiznova_app.client_id
}
resource "azuread_application_federated_identity_credential" "quiznova_main" {
  application_id = azuread_application.quiznova_app.id
  display_name   = azuread_application.quiznova_app.display_name
  description    = "Federated credential for QuizNova main branch"
  audiences      = ["api://AzureADTokenExchange"]
  issuer         = "https://token.actions.githubusercontent.com"
  subject        = "repo:${var.github_owner}/${var.github_repository_name}:ref:refs/heads/main"
}

resource "azurerm_role_assignment" "quiznova_contributor" {
  scope                = "/subscriptions/${var.azure_subscription_id}/resourceGroups/${azurerm_resource_group.app_rg.name}"
  role_definition_name = "Contributor"
  principal_id         = azuread_service_principal.quiznova_sp.object_id
}
