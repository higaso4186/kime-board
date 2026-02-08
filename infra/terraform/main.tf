module "foundation" {
  source = "./modules/foundation"

  project_id            = var.project_id
  region                = var.region
  required_apis         = var.required_apis
  artifact_repo         = var.artifact_repo
  service_accounts      = var.service_accounts
  service_account_roles = var.service_account_roles
  cicd_account_id       = var.cicd_account_id
  secret_names          = var.secret_names
  secret_access_map     = var.secret_access_map
}

module "db" {
  source = "./modules/db"

  project_id      = var.project_id
  database_id     = var.firestore_database_id
  location_id     = local.resolved_firestore_location
  prevent_destroy = var.firestore_prevent_destroy

  depends_on = [module.foundation]
}

module "adk" {
  source = "./modules/adk"

  project_id                  = var.project_id
  region                      = var.region
  queue_name                  = var.agent_queue_name
  max_dispatches_per_second   = var.agent_queue_max_dispatches_per_second
  max_concurrent_dispatches   = var.agent_queue_max_concurrent_dispatches
  max_attempts                = var.agent_queue_max_attempts
  min_backoff_seconds         = var.agent_queue_min_backoff_seconds
  max_backoff_seconds         = var.agent_queue_max_backoff_seconds

  depends_on = [module.foundation]
}

module "cloud_run" {
  source = "./modules/cloud_run"
  count  = var.enable_cloud_run ? 1 : 0

  project_id                   = var.project_id
  region                       = var.region
  service_account_emails       = module.foundation.service_account_emails
  web_service_name             = var.web_service_name
  api_service_name             = var.api_service_name
  agent_service_name           = var.agent_service_name
  web_image                    = var.web_image
  api_image                    = var.api_image
  agent_image                  = var.agent_image
  web_public                   = var.web_public
  api_public                   = var.api_public
  min_instances                = var.cloud_run_min_instances
  max_instances                = var.cloud_run_max_instances
  cpu                          = var.cloud_run_cpu
  memory                       = var.cloud_run_memory
  concurrency                  = var.cloud_run_concurrency
  timeout_seconds              = var.cloud_run_timeout_seconds
  next_public_api_base_url     = local.resolved_api_base_url
  firestore_project_id         = var.project_id
  cloud_tasks_queue            = var.agent_queue_name
  agent_invoker_account_ids    = var.agent_invoker_accounts

  depends_on = [module.foundation, module.db, module.adk]
}
