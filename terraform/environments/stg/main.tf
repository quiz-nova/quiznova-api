module "api_env" {
  source                = "../../modules/api_environment"
  environment_name      = "stg"
  doppler_config        = "stg"
  resource_group_name   = "quiznova-rg"
  min_replicas          = 0
  max_replicas          = 1
  cpu                   = "0.25"
  memory                = "0.5Gi"
  azure_subscription_id = var.azure_subscription_id

  allowed_origins = [
    "http://localhost:4200",
    "https://staging.quiznova.dev"
  ]
}

output "api_fqdn" {
  description = "Staging Container App FQDN"
  value       = module.api_env.container_app_fqdn
}

output "api_name" {
  description = "Staging Container App Name"
  value       = module.api_env.container_app_name
}
