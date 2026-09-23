resource "mongodbatlas_project_ip_access_list" "aca_ips" {
  for_each   = toset(azurerm_container_app.backend_app.outbound_ip_addresses)
  project_id = data.doppler_secrets.app.map.ATLAS_PROJECT_ID
  ip_address = each.value
  comment    = "Outbound IP from Azure Container App (QuizNova API)"
}
