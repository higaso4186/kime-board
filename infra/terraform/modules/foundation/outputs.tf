output "service_account_emails" {
  value = {
    for account_id, resource in google_service_account.accounts : account_id => resource.email
  }
}

output "artifact_repository" {
  value = google_artifact_registry_repository.docker_repo.id
}

output "secret_names" {
  value = [for name, _ in google_secret_manager_secret.secrets : name]
}
