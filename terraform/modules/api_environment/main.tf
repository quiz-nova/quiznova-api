data "azurerm_client_config" "current" {}

data "doppler_secrets" "app" {
  project = var.doppler_project
  config  = var.doppler_config
}

resource "azurerm_container_app_environment" "app_env" {
  name                = "quiznova-env-${var.environment_name}"
  resource_group_name = var.resource_group_name
  location            = var.location

  tags = merge(local.common_tags, {
    Component = "container-environment"
  })
}

resource "mongodbatlas_project_ip_access_list" "allow_aca" {
  project_id = data.doppler_secrets.app.map.ATLAS_PROJECT_ID
  cidr_block = "0.0.0.0/0"
  comment    = "Allow Azure Container Apps ${var.environment_name}"
}
