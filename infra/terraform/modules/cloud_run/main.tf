locals {
  agent_url = google_cloud_run_v2_service.agent.uri

  api_url = google_cloud_run_v2_service.api.uri

  resolved_api_base_url = var.next_public_api_base_url != "" ? var.next_public_api_base_url : local.api_url

  agent_invoker_members = {
    for account_id in var.agent_invoker_account_ids :
    account_id => "serviceAccount:${var.service_account_emails[account_id]}"
    if contains(keys(var.service_account_emails), account_id)
  }
}

resource "google_cloud_run_v2_service" "agent" {
  name     = var.agent_service_name
  location = var.region
  project  = var.project_id
  ingress  = "INGRESS_TRAFFIC_ALL"

  template {
    service_account = var.service_account_emails[var.agent_service_account_id]
    timeout         = "${var.timeout_seconds}s"
    max_instance_request_concurrency = var.concurrency

    scaling {
      min_instance_count = var.min_instances
      max_instance_count = var.max_instances
    }

    containers {
      image = var.agent_image

      resources {
        limits = {
          cpu    = var.cpu
          memory = var.memory
        }
      }

      env {
        name  = "APP_ENV"
        value = var.app_env
      }

      env {
        name  = "API_BASE_URL"
        value = local.api_url
      }

      env {
        name  = "API_AUDIENCE"
        value = local.api_url
      }

      env {
        name = "VERTEX_MODEL"
        value_source {
          secret_key_ref {
            secret  = var.vertex_model_secret
            version = "latest"
          }
        }
      }

      env {
        name = "AGENT_CALLBACK_TOKEN"
        value_source {
          secret_key_ref {
            secret  = var.agent_callback_token_secret
            version = "latest"
          }
        }
      }
    }
  }
}

resource "google_cloud_run_v2_service" "api" {
  name     = var.api_service_name
  location = var.region
  project  = var.project_id
  ingress  = "INGRESS_TRAFFIC_ALL"

  template {
    service_account = var.service_account_emails[var.api_service_account_id]
    timeout         = "${var.timeout_seconds}s"
    max_instance_request_concurrency = var.concurrency

    scaling {
      min_instance_count = var.min_instances
      max_instance_count = var.max_instances
    }

    containers {
      image = var.api_image

      resources {
        limits = {
          cpu    = var.cpu
          memory = var.memory
        }
      }

      env {
        name  = "APP_ENV"
        value = var.app_env
      }

      env {
        name  = "FIRESTORE_PROJECT_ID"
        value = var.firestore_project_id
      }

      env {
        name  = "CLOUD_TASKS_QUEUE"
        value = var.cloud_tasks_queue
      }

      env {
        name  = "AGENT_TASK_URL_MEETING"
        value = "${local.agent_url}/tasks/meeting_structurer"
      }

      env {
        name  = "AGENT_TASK_URL_REPLY"
        value = "${local.agent_url}/tasks/reply_integrator"
      }

      env {
        name  = "AGENT_TASK_URL_ACTIONS"
        value = "${local.agent_url}/tasks/draft_actions_skill"
      }

      env {
        name = "API_INTERNAL_TOKEN"
        value_source {
          secret_key_ref {
            secret  = var.api_internal_token_secret
            version = "latest"
          }
        }
      }

      env {
        name = "AGENT_CALLBACK_TOKEN"
        value_source {
          secret_key_ref {
            secret  = var.agent_callback_token_secret
            version = "latest"
          }
        }
      }
    }
  }

  depends_on = [google_cloud_run_v2_service.agent]
}

resource "google_cloud_run_v2_service" "web" {
  name     = var.web_service_name
  location = var.region
  project  = var.project_id
  ingress  = "INGRESS_TRAFFIC_ALL"

  template {
    service_account = var.service_account_emails[var.web_service_account_id]
    timeout         = "${var.timeout_seconds}s"
    max_instance_request_concurrency = var.concurrency

    scaling {
      min_instance_count = var.min_instances
      max_instance_count = var.max_instances
    }

    containers {
      image = var.web_image

      resources {
        limits = {
          cpu    = var.cpu
          memory = var.memory
        }
      }

      env {
        name  = "APP_ENV"
        value = var.app_env
      }

      env {
        name  = "NEXT_PUBLIC_API_BASE_URL"
        value = local.resolved_api_base_url
      }
    }
  }

  depends_on = [google_cloud_run_v2_service.api]
}

resource "google_cloud_run_v2_service_iam_member" "web_public_invoker" {
  count = var.web_public ? 1 : 0

  name     = google_cloud_run_v2_service.web.name
  location = var.region
  project  = var.project_id
  role     = "roles/run.invoker"
  member   = "allUsers"
}

resource "google_cloud_run_v2_service_iam_member" "api_public_invoker" {
  count = var.api_public ? 1 : 0

  name     = google_cloud_run_v2_service.api.name
  location = var.region
  project  = var.project_id
  role     = "roles/run.invoker"
  member   = "allUsers"
}

resource "google_cloud_run_v2_service_iam_member" "agent_invokers" {
  for_each = local.agent_invoker_members

  name     = google_cloud_run_v2_service.agent.name
  location = var.region
  project  = var.project_id
  role     = "roles/run.invoker"
  member   = each.value
}
