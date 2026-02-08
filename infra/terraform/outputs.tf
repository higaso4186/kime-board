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
