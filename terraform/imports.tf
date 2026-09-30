# ==============================================================================
# Declarative Imports for Existing Azure AD, Azure RBAC, and GitHub Resources
# ==============================================================================

# 1. Import existing Azure AD Application (/applications/{objectId})
import {
  to = azuread_application.quiznova_app
  id = "/applications/0ce7ba63-279b-475a-a426-e5366f17eaed"
}

# 2. Import existing Service Principal ({objectId})
import {
  to = azuread_service_principal.quiznova_sp
  id = "2b0ef9a6-4e2b-491d-8b38-db4fe6e2a32f"
}

# 3. Import existing Federated Identity Credential ({objectId}/federatedIdentityCredential/{subId})
import {
  to = azuread_application_federated_identity_credential.quiznova_main
  id = "0ce7ba63-279b-475a-a426-e5366f17eaed/federatedIdentityCredential/fe6724c0-45e2-4ecf-9b23-8253b69f6c60"
}

# 4. Import existing Role Assignment (Contributor on quiz-nova-resource-group)
import {
  to = azurerm_role_assignment.quiznova_contributor
  id = "/subscriptions/83ab56f5-88ee-436d-87a5-994d3185bf00/resourceGroups/quiz-nova-resource-group/providers/Microsoft.Authorization/roleAssignments/68132fb2-d9ea-45e6-843d-34bbce2e07c3"
}

# 5. Import existing GitHub Actions Secrets
import {
  to = github_actions_secret.azure_client_id
  id = "quiznova-api:AZURE_CLIENT_ID"
}

import {
  to = github_actions_secret.azure_tenant_id
  id = "quiznova-api:AZURE_TENANT_ID"
}

import {
  to = github_actions_secret.azure_subscription_id
  id = "quiznova-api:AZURE_SUBSCRIPTION_ID"
}

# 6. Import existing Standard Federated Identity Credential
import {
  to = azuread_application_federated_identity_credential.quiznova_main_standard
  id = "0ce7ba63-279b-475a-a426-e5366f17eaed/federatedIdentityCredential/1f0ed531-627c-4263-a690-04868b5c3ffd"
}

# 7. Import existing Resource Group
import {
  to = azurerm_resource_group.app_rg
  id = "/subscriptions/83ab56f5-88ee-436d-87a5-994d3185bf00/resourceGroups/quiz-nova-resource-group"
}

# 8. Import existing Key Vault
import {
  to = azurerm_key_vault.main
  id = "/subscriptions/83ab56f5-88ee-436d-87a5-994d3185bf00/resourceGroups/quiz-nova-resource-group/providers/Microsoft.KeyVault/vaults/quiznova-kv"
}

# 9. Import existing User Assigned Identity
import {
  to = azurerm_user_assigned_identity.aca
  id = "/subscriptions/83ab56f5-88ee-436d-87a5-994d3185bf00/resourceGroups/quiz-nova-resource-group/providers/Microsoft.ManagedIdentity/userAssignedIdentities/quiznova-aca-identity"
}

# 10. Import existing Container App Environment
import {
  to = azurerm_container_app_environment.app_env
  id = "/subscriptions/83ab56f5-88ee-436d-87a5-994d3185bf00/resourceGroups/quiz-nova-resource-group/providers/Microsoft.App/managedEnvironments/quiznova-env"
}

# 11. Import existing Container App
import {
  to = azurerm_container_app.backend_app
  id = "/subscriptions/83ab56f5-88ee-436d-87a5-994d3185bf00/resourceGroups/quiz-nova-resource-group/providers/Microsoft.App/containerApps/quiznova-api"
}

# 12. Import existing Key Vault Secrets
import {
  to = azurerm_key_vault_secret.db_connection
  id = "https://quiznova-kv.vault.azure.net/secrets/db-connection-string/5347ecbc49b840908234b9e2ff165998"
}

import {
  to = azurerm_key_vault_secret.jwt_secret
  id = "https://quiznova-kv.vault.azure.net/secrets/jwt-secret/12d23c4d2d1c4afe8c9f4e82e23c3dc5"
}

import {
  to = azurerm_key_vault_secret.mongodb_connection
  id = "https://quiznova-kv.vault.azure.net/secrets/mongodb-connection-string/b1b50c6439814b3db7c2a05eb23c8127"
}

import {
  to = azurerm_key_vault_secret.grafana_loki_password
  id = "https://quiznova-kv.vault.azure.net/secrets/grafana-loki-password/6bce5b3ae1ac4de49de7d108197c6fb0"
}

import {
  to = azurerm_key_vault_secret.grafana_otlp_auth
  id = "https://quiznova-kv.vault.azure.net/secrets/grafana-otlp-auth-header/88abe89fb8684d18a8ceee2e844f2f73"
}