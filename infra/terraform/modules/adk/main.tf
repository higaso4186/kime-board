resource "google_cloud_tasks_queue" "agent_queue" {
  project  = var.project_id
  location = var.region
  name     = var.queue_name

  rate_limits {
    max_dispatches_per_second = var.max_dispatches_per_second
    max_concurrent_dispatches = var.max_concurrent_dispatches
  }

  retry_config {
    max_attempts       = var.max_attempts
    min_backoff        = "${var.min_backoff_seconds}s"
    max_backoff        = "${var.max_backoff_seconds}s"
    max_retry_duration = "0s"
  }
}
