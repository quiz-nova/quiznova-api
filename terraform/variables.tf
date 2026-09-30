# Doppler Configuration
variable "doppler_project" {
  type        = string
  description = "The Doppler project name"
  default     = "quiznova-api"
}

variable "doppler_config" {
  type        = string
  description = "The Doppler config environment (e.g. prd, stg, dev)"
  default     = "prd"
}

# Monitoring & Logging
variable "grafana_loki_instance_id" {
  description = "Grafana Loki Instance ID for credentials.login"
  type        = string
  default     = "1640218"
}

variable "grafana_loki_uri" {
  description = "The Grafana Loki ingest endpoint URI"
  type        = string
  default     = "https://logs-prod-012.grafana.net"
}

variable "grafana_otlp_endpoint" {
  description = "Grafana Cloud OTLP Gateway endpoint for OpenTelemetry traces"
  type        = string
  default     = "https://otlp-gateway-prod-eu-west-2.grafana.net/otlp"
}

# Application & Connection Settings
variable "allowed_origins" {
  type = list(string)
  default = [
    "https://moamenelbarqy.github.io",
    "https://quiznova.dev",
    "https://www.quiznova.dev"
  ]
}

variable "postgres_maximum_pool_size" {
  type        = number
  description = "Maximum connection pool size for PostgreSQL"
  default     = 100
}

variable "postgres_minimum_pool_size" {
  type        = number
  description = "Minimum connection pool size for PostgreSQL"
  default     = 0
}

variable "postgres_connection_timeout_seconds" {
  type        = number
  description = "Connection timeout in seconds for PostgreSQL"
  default     = 15
}

variable "mongodb_max_connection_pool_size" {
  type        = number
  description = "Maximum connection pool size for MongoDB"
  default     = 100
}

variable "mongodb_min_connection_pool_size" {
  type        = number
  description = "Minimum connection pool size for MongoDB"
  default     = 0
}

variable "mongodb_max_connecting" {
  type        = number
  description = "Maximum connections currently being established for MongoDB"
  default     = 2
}

variable "mongodb_wait_queue_timeout_minutes" {
  type        = number
  description = "Wait queue timeout in minutes for MongoDB"
  default     = 2
}

# Azure & GitHub Configuration
variable "azure_subscription_id" {
  type        = string
  description = "The Azure subscription ID"
  default     = "83ab56f5-88ee-436d-87a5-994d3185bf00"
}

variable "github_owner" {
  type        = string
  description = "The GitHub user or organization that owns the repository"
  default     = "quiz-nova"
}

variable "github_repository_name" {
  type        = string
  description = "The GitHub repository name"
  default     = "quiznova-api"
}

variable "github_organization_id" {
  type        = string
  description = "The GitHub Organization numeric ID"
  default     = "325215040"
}

variable "github_repository_id" {
  type        = string
  description = "The GitHub Repository numeric ID"
  default     = "1181284429"
}

variable "ghcr_username" {
  type        = string
  description = "GitHub username or organization used to pull from GHCR"
  default     = "quiz-nova"
}

variable "ghcr_token" {
  type        = string
  description = "GitHub Personal Access Token (Classic) with read:packages permission"
  sensitive   = true
  default     = null
}