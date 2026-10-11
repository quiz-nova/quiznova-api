variable "environment_name" {
  type        = string
  description = "Environment identifier (e.g. dev, stg, prd)"
}

variable "doppler_project" {
  type        = string
  description = "Doppler project name"
  default     = "quiznova-api"
}

variable "doppler_config" {
  type        = string
  description = "Doppler config name (e.g. dev, stg, prd)"
}

variable "resource_group_name" {
  type        = string
  description = "Name of the resource group to deploy resources into"
  default     = "quiznova-rg"
}

variable "location" {
  type        = string
  description = "Azure region"
  default     = "swedencentral"
}

variable "min_replicas" {
  type        = number
  description = "Minimum replicas for Container App (0 to scale to zero and save cost)"
  default     = 0
}

variable "max_replicas" {
  type        = number
  description = "Maximum replicas for Container App"
  default     = 1
}

variable "cpu" {
  type        = string
  description = "CPU allocation for the container"
  default     = "0.25"
}

variable "memory" {
  type        = string
  description = "Memory allocation for the container"
  default     = "0.5Gi"
}

variable "allowed_origins" {
  type        = list(string)
  description = "CORS allowed origins for the API"
  default     = []
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
  description = "GitHub Personal Access Token with read:packages permission"
  sensitive   = true
  default     = null
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
