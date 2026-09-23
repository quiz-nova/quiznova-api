# Doppler data source to fetch secrets dynamically
data "doppler_secrets" "app" {
  project = var.doppler_project
  config  = var.doppler_config
}
