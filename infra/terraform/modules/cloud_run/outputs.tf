output "service_urls" {
  value = {
    web   = google_cloud_run_v2_service.web.uri
    api   = google_cloud_run_v2_service.api.uri
    agent = google_cloud_run_v2_service.agent.uri
  }
}
