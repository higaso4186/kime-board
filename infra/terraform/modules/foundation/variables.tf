variable "project_id" {
  type = string
}

variable "region" {
  type = string
}

variable "required_apis" {
  type = list(string)
}

variable "artifact_repo" {
  type = string
}

variable "service_accounts" {
  type = map(string)
}

variable "service_account_roles" {
  type = map(list(string))
}

variable "cicd_account_id" {
  type = string
}

variable "secret_names" {
  type = set(string)
}

variable "secret_access_map" {
  type = map(list(string))
}
