output "project_id" {
  value = var.project_id
}

output "region" {
  value = var.region
}

output "service_account_emails" {
  value = module.foundation.service_account_emails
}

output "artifact_repository" {
  value = module.foundation.artifact_repository
}

output "firestore_database" {
  value = module.db.database_name
}

output "agent_queue" {
  value = module.adk.queue_name
}

output "cloud_run_urls" {
  value = var.enable_cloud_run ? module.cloud_run[0].service_urls : {}
}

output "local_runtime_hints" {
  value = {
    api = {
      FIRESTORE_PROJECT_ID           = var.project_id
      GOOGLE_CLOUD_PROJECT           = var.project_id
      CLOUD_TASKS_QUEUE              = module.adk.queue_name
      CLOUD_TASKS_LOCATION           = var.region
      DISABLE_CLOUD_TASKS            = "false"
      TASK_OIDC_SERVICE_ACCOUNT_EMAIL = lookup(module.foundation.service_account_emails, "kimeboard-api-mvp", "")
      AGENT_TASK_OIDC_AUDIENCE       = var.enable_cloud_run ? module.cloud_run[0].service_urls.agent : ""
      AGENT_TASK_URL_MEETING         = var.enable_cloud_run ? "${module.cloud_run[0].service_urls.agent}/tasks/meeting_structurer" : ""
      AGENT_TASK_URL_REPLY           = var.enable_cloud_run ? "${module.cloud_run[0].service_urls.agent}/tasks/reply_integrator" : ""
      AGENT_TASK_URL_ACTIONS         = var.enable_cloud_run ? "${module.cloud_run[0].service_urls.agent}/tasks/draft_actions_skill" : ""
    }
    agent = {
      API_BASE_URL        = var.enable_cloud_run ? module.cloud_run[0].service_urls.api : ""
      API_AUDIENCE        = var.enable_cloud_run ? module.cloud_run[0].service_urls.api : ""
      TASK_AUTH_MODE      = "NONE"
      TASK_OIDC_AUDIENCE  = var.enable_cloud_run ? module.cloud_run[0].service_urls.agent : ""
    }
  }
}
