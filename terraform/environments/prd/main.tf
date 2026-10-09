module "api_env" {
  source                = "../../modules/api_environment"
  environment_name      = "prd"
  doppler_config        = "prd"
  resource_group_name   = "quiznova-rg"
  min_replicas          = 0
  max_replicas          = 1
  cpu                   = "0.5"
  memory                = "1Gi"
  azure_subscription_id = var.azure_subscription_id

  allowed_origins = [
    "https://moamenelbarqy.github.io",
    "https://quiznova.dev",
    "https://www.quiznova.dev"
  ]
}

output "api_fqdn" {
  description = "Production Container App FQDN"
  value       = module.api_env.container_app_fqdn
}

output "api_name" {
  description = "Production Container App Name"
  value       = module.api_env.container_app_name
}
