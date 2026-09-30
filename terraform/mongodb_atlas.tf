resource "mongodbatlas_project_ip_access_list" "allow_all" {
  project_id = data.doppler_secrets.app.map.ATLAS_PROJECT_ID
  cidr_block = "0.0.0.0/0"
  comment    = "Allow connection from Azure Container Apps (secured via Key Vault credentials)"
}

