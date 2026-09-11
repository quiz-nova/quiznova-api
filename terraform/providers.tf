terraform {
  required_version = ">= 1.5.0"

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "=4.1.0"
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
  }
}

provider "azurerm" {
  subscription_id                 = var.azure_subscription_id
  resource_provider_registrations = "none"
  features {}
}

provider "azuread" {}

provider "github" {
  owner = var.github_owner
}

provider "mongodbatlas" {
  public_key  = var.atlas_public_key
  private_key = var.atlas_private_key
}

data "azurerm_client_config" "current" {}
