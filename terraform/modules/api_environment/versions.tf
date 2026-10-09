terraform {
  required_version = ">= 1.5.0"

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
