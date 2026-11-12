# ==============================================================================
# Common Module Locals & Tags
# ==============================================================================

locals {
  common_tags = {
    Project     = "quiznova"
    Environment = var.environment_name
    Service     = "quiznova-api"
    ManagedBy   = "terraform"
    Owner       = "moamenelbarky"
  }
}
