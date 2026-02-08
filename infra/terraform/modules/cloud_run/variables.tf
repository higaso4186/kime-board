variable "project_id" {
  type = string
}

variable "region" {
  type = string
}

variable "service_account_emails" {
  type = map(string)
}

variable "web_service_name" {
  type = string
}

variable "api_service_name" {
  type = string
}

variable "agent_service_name" {
  type = string
}

variable "web_image" {
  type = string
}

variable "api_image" {
  type = string
}

variable "agent_image" {
  type = string
}

variable "web_public" {
  type = bool
}

variable "api_public" {
  type = bool
}

variable "min_instances" {
  type = number
}

variable "max_instances" {
  type = number
}

variable "cpu" {
  type = string
}

variable "memory" {
  type = string
}

variable "concurrency" {
  type = number
}

variable "timeout_seconds" {
  type = number
}

variable "next_public_api_base_url" {
  type = string
}

variable "firestore_project_id" {
  type = string
}

variable "cloud_tasks_queue" {
  type = string
}

variable "agent_invoker_account_ids" {
  type = list(string)
}

variable "web_service_account_id" {
  type    = string
  default = "kimeboard-web-mvp"
}

variable "api_service_account_id" {
  type    = string
  default = "kimeboard-api-mvp"
}

variable "agent_service_account_id" {
  type    = string
  default = "kimeboard-agent-mvp"
}

variable "app_env" {
  type    = string
  default = "mvp"
}

variable "api_internal_token_secret" {
  type    = string
  default = "API_INTERNAL_TOKEN"
}

variable "agent_callback_token_secret" {
  type    = string
  default = "AGENT_CALLBACK_TOKEN"
}

variable "vertex_model_secret" {
  type    = string
  default = "VERTEX_MODEL"
}
