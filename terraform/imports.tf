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
  id = "0ce7ba63-279b-475a-a426-e5366f17eaed/federatedIdentityCredential/d3fa12c5-3c2a-487d-bf37-4a4929197a5c"
}

# 4. Import existing Role Assignment (Contributor on quiz-nova-resource-group)
import {
  to = azurerm_role_assignment.quiznova_contributor
  id = "/subscriptions/83ab56f5-88ee-436d-87a5-994d3185bf00/resourceGroups/quiz-nova-resource-group/providers/Microsoft.Authorization/roleAssignments/68132fb2-d9ea-45e6-843d-34bbce2e07c3"
}

# 5. Import existing GitHub Actions Secrets
import {
  to = github_actions_secret.azure_client_id
  id = "quiz-nova:AZURE_CLIENT_ID"
}

import {
  to = github_actions_secret.azure_tenant_id
  id = "quiz-nova:AZURE_TENANT_ID"
}

import {
  to = github_actions_secret.azure_subscription_id
  id = "quiz-nova:AZURE_SUBSCRIPTION_ID"
}