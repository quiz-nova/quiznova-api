# Primary Azure Resource Group
resource "azurerm_resource_group" "app_rg" {
  name     = "quiz-nova-resource-group"
  location = "swedencentral"
}

# Azure Container App Environment
resource "azurerm_container_app_environment" "app_env" {
  name                = "quiznova-env"
  resource_group_name = azurerm_resource_group.app_rg.name
  location            = azurerm_resource_group.app_rg.location
}
