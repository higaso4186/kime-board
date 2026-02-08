variable "project_id" {
  description = "GCP project id"
  type        = string
}

variable "region" {
  description = "GCP region"
  type        = string
  default     = "asia-northeast1"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "mvp"
}

variable "apex_domain" {
  description = "Apex domain, e.g. example.com"
  type        = string
  default     = ""
}

variable "api_base_url" {
  description = "Explicit API base URL for web service env"
  type        = string
  default     = ""
}

variable "api_domain" {
  description = "API domain override, e.g. api-mvp.example.com"
  type        = string
  default     = ""
}

variable "web_domain" {
  description = "Web domain override, e.g. mvp.example.com"
  type        = string
  default     = ""
}

variable "required_apis" {
  description = "APIs to enable for infra"
  type        = list(string)
  default = [
    "run.googleapis.com",
    "artifactregistry.googleapis.com",
    "firestore.googleapis.com",
    "cloudtasks.googleapis.com",
    "secretmanager.googleapis.com",
    "iam.googleapis.com",
    "cloudresourcemanager.googleapis.com",
    "dns.googleapis.com",
    "certificatemanager.googleapis.com"
  ]
}

variable "artifact_repo" {
  description = "Artifact Registry repository name"
  type        = string
  default     = "kimeboard-mvp"
}

variable "service_accounts" {
  description = "Service account id to display name map"
  type        = map(string)
  default = {
    "kimeboard-web-mvp"   = "kimeboard web mvp"
    "kimeboard-api-mvp"   = "kimeboard api mvp"
    "kimeboard-agent-mvp" = "kimeboard agent mvp"
    "kimeboard-cicd-mvp"  = "kimeboard cicd mvp"
  }
}

variable "service_account_roles" {
  description = "Project IAM roles per service account id"
  type        = map(list(string))
  default = {
    "kimeboard-api-mvp" = [
      "roles/datastore.user",
      "roles/cloudtasks.enqueuer",
      "roles/secretmanager.secretAccessor"
    ]
    "kimeboard-agent-mvp" = [
      "roles/secretmanager.secretAccessor",
      "roles/aiplatform.user"
    ]
    "kimeboard-cicd-mvp" = [
      "roles/run.admin",
      "roles/iam.serviceAccountUser",
      "roles/artifactregistry.writer"
    ]
  }
}

variable "cicd_account_id" {
  description = "Service account id used for CI/CD"
  type        = string
  default     = "kimeboard-cicd-mvp"
}

variable "secret_names" {
  description = "Secret Manager secret names"
  type        = set(string)
  default = [
    "MVP_CONFIG",
    "API_INTERNAL_TOKEN",
    "VERTEX_MODEL",
    "AGENT_CALLBACK_TOKEN"
  ]
}

variable "secret_access_map" {
  description = "Secret -> service account ids (accessor role)"
  type        = map(list(string))
  default = {
    "MVP_CONFIG"          = ["kimeboard-web-mvp", "kimeboard-api-mvp", "kimeboard-agent-mvp"]
    "API_INTERNAL_TOKEN"  = ["kimeboard-api-mvp"]
    "VERTEX_MODEL"        = ["kimeboard-agent-mvp"]
    "AGENT_CALLBACK_TOKEN" = ["kimeboard-api-mvp", "kimeboard-agent-mvp"]
  }
}

variable "firestore_database_id" {
  description = "Firestore database id"
  type        = string
  default     = "(default)"
}

variable "firestore_location" {
  description = "Firestore location (if empty, region is used)"
  type        = string
  default     = ""
}

variable "firestore_prevent_destroy" {
  description = "Prevent accidental Firestore destroy"
  type        = bool
  default     = true
}

variable "agent_queue_name" {
  description = "Cloud Tasks queue name for agent tasks"
  type        = string
  default     = "agent-queue-mvp"
}

variable "agent_queue_max_dispatches_per_second" {
  type    = number
  default = 2
}

variable "agent_queue_max_concurrent_dispatches" {
  type    = number
  default = 1
}

variable "agent_queue_max_attempts" {
  type    = number
  default = 5
}

variable "agent_queue_min_backoff_seconds" {
  type    = number
  default = 10
}

variable "agent_queue_max_backoff_seconds" {
  type    = number
  default = 120
}

variable "enable_cloud_run" {
  description = "Whether to provision Cloud Run services"
  type        = bool
  default     = false
}

variable "web_service_name" {
  type    = string
  default = "kimeboard-web-mvp"
}

variable "api_service_name" {
  type    = string
  default = "kimeboard-api-mvp"
}

variable "agent_service_name" {
  type    = string
  default = "kimeboard-agent-mvp"
}

variable "web_image" {
  description = "Container image URI for web service"
  type        = string
  default     = "us-docker.pkg.dev/cloudrun/container/hello"
}

variable "api_image" {
  description = "Container image URI for api service"
  type        = string
  default     = "us-docker.pkg.dev/cloudrun/container/hello"
}

variable "agent_image" {
  description = "Container image URI for agent service"
  type        = string
  default     = "us-docker.pkg.dev/cloudrun/container/hello"
}

variable "web_public" {
  type    = bool
  default = true
}

variable "api_public" {
  type    = bool
  default = true
}

variable "cloud_run_min_instances" {
  type    = number
  default = 0
}

variable "cloud_run_max_instances" {
  type    = number
  default = 2
}

variable "cloud_run_cpu" {
  type    = string
  default = "1"
}

variable "cloud_run_memory" {
  type    = string
  default = "512Mi"
}

variable "cloud_run_concurrency" {
  type    = number
  default = 40
}

variable "cloud_run_timeout_seconds" {
  type    = number
  default = 60
}

variable "agent_invoker_accounts" {
  description = "Service account ids that can invoke agent cloud run"
  type        = list(string)
  default     = ["kimeboard-api-mvp", "kimeboard-cicd-mvp"]
}
