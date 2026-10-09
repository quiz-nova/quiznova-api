resource "azuread_application" "quiznova_app" {
  display_name = "github-actions-quiz-nova-${var.environment_name}"
}

resource "azuread_service_principal" "quiznova_sp" {
  client_id = azuread_application.quiznova_app.client_id
}

resource "azuread_application_federated_identity_credential" "quiznova_env" {
  application_id = azuread_application.quiznova_app.id
  display_name   = "github-actions-quiznova-${var.environment_name}-env"
  description    = "Federated credential for QuizNova API ${var.environment_name} GitHub environment"
  audiences      = ["api://AzureADTokenExchange"]
  issuer         = "https://token.actions.githubusercontent.com"
  subject        = "repo:${var.github_owner}/${var.github_repository_name}:environment:${var.environment_name == "dev" ? "development" : (var.environment_name == "stg" ? "staging" : "production")}"
}

resource "azuread_application_federated_identity_credential" "quiznova_branch" {
  application_id = azuread_application.quiznova_app.id
  display_name   = "github-actions-quiznova-${var.environment_name}-branch"
  description    = "Federated credential for QuizNova API ${var.environment_name} branch"
  audiences      = ["api://AzureADTokenExchange"]
  issuer         = "https://token.actions.githubusercontent.com"
  subject        = "repo:${var.github_owner}/${var.github_repository_name}:ref:refs/heads/${var.environment_name == "dev" ? "develop" : (var.environment_name == "stg" ? "staging" : "main")}"
}

resource "azurerm_role_assignment" "quiznova_contributor" {
  scope                = "/subscriptions/${var.azure_subscription_id}/resourceGroups/${var.resource_group_name}"
  role_definition_name = "Contributor"
  principal_id         = azuread_service_principal.quiznova_sp.object_id
}

resource "github_actions_environment_secret" "azure_client_id" {
  repository      = var.github_repository_name
  environment     = var.environment_name == "dev" ? "development" : (var.environment_name == "stg" ? "staging" : "production")
  secret_name     = "AZURE_CLIENT_ID"
  plaintext_value = azuread_application.quiznova_app.client_id
}

resource "github_actions_environment_secret" "azure_tenant_id" {
  repository      = var.github_repository_name
  environment     = var.environment_name == "dev" ? "development" : (var.environment_name == "stg" ? "staging" : "production")
  secret_name     = "AZURE_TENANT_ID"
  plaintext_value = data.azurerm_client_config.current.tenant_id
}

resource "github_actions_environment_secret" "azure_subscription_id" {
  repository      = var.github_repository_name
  environment     = var.environment_name == "dev" ? "development" : (var.environment_name == "stg" ? "staging" : "production")
  secret_name     = "AZURE_SUBSCRIPTION_ID"
  plaintext_value = var.azure_subscription_id
}
