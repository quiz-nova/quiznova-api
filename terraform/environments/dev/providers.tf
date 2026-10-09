terraform {
  required_version = ">= 1.5.0"

  backend "azurerm" {
    resource_group_name  = "quiznova-rg"
    storage_account_name = "stquiznova"
    container_name       = "quiznova-api-dev-tfstate"
    key                  = "terraform.tfstate"
    use_azuread_auth     = true
  }

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 4.0"
    }
    azuread = {
      source  = "hashicorp/azuread"
      version = "~> 2.47"
    }
    github = {
      source  = "integrations/github"
      version = "~> 6.0"
    }
    mongodbatlas = {
      source  = "mongodb/mongodbatlas"
      version = "~> 2.15.0"
    }
    doppler = {
      source  = "dopplerhq/doppler"
      version = "~> 1.13.0"
    }
  }
}

variable "azure_subscription_id" {
  type    = string
  default = "83ab56f5-88ee-436d-87a5-994d3185bf00"
}

provider "azurerm" {
  subscription_id                 = var.azure_subscription_id
  resource_provider_registrations = "none"
  features {}
}

provider "azuread" {}

provider "github" {
  owner = "quiz-nova"
}

provider "doppler" {}

data "doppler_secrets" "provider" {
  project = "quiznova-api"
  config  = "dev"
}

provider "mongodbatlas" {
  public_key  = data.doppler_secrets.provider.map.ATLAS_PUBLIC_KEY
  private_key = data.doppler_secrets.provider.map.ATLAS_PRIVATE_KEY
}
