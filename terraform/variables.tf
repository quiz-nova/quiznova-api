variable "db_connection_string" {
  type        = string
  description = "Connection string for Neon PostgreSQL"
  sensitive   = true
}

variable "jwt_secret" {
  type        = string
  description = "JWT Signing Secret Key"
  sensitive   = true
}

variable "grafana_loki_password" {
  type        = string
  description = "Grafana Loki API Key / Password"
  sensitive   = true
}

variable "grafana_loki_instance_id" {
  description = "Grafana Loki Instance ID for credentials.login"
  type        = string
}

variable "grafana_loki_uri" {
  description = "The Grafana Loki ingest endpoint URI"
  type        = string
}

variable "grafana_otlp_endpoint" {
  description = "Grafana Cloud OTLP Gateway endpoint for OpenTelemetry traces"
  type        = string
  default     = "https://otlp-gateway-prod-eu-west-2.grafana.net/otlp"
}

variable "grafana_otlp_auth_header" {
  description = "Base64 encoded Instance ID : API Key / Password for Grafana OTLP OTel traces"
  type        = string
  sensitive   = true
}

variable "mongodb_connection_string" {
  type        = string
  description = "MongoDB Atlas Connection String"
  sensitive   = true
}

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

variable "atlas_public_key" {
  type = string
}

variable "atlas_private_key" {
  type      = string
  sensitive = true
}

variable "atlas_project_id" {
  type      = string
  sensitive = true
}

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
  default     = "quiz-nova"
}