resource "google_project_service" "required" {
  for_each = toset(var.required_apis)

  project            = var.project_id
  service            = each.value
  disable_on_destroy = false
}

resource "google_artifact_registry_repository" "docker_repo" {
  project       = var.project_id
  location      = var.region
  repository_id = var.artifact_repo
  format        = "DOCKER"

  depends_on = [google_project_service.required]
}

resource "google_service_account" "accounts" {
  for_each = var.service_accounts

  project      = var.project_id
  account_id   = each.key
  display_name = each.value

  depends_on = [google_project_service.required]
}

locals {
  role_bindings = flatten([
    for sa_id, roles in var.service_account_roles : [
      for role in roles : {
        key   = "${sa_id}-${replace(role, "/", "-")}"
        sa_id = sa_id
        role  = role
      }
    ]
  ])

  role_binding_map = {
    for item in local.role_bindings : item.key => item
  }

  secret_access_entries = flatten([
    for secret_name, account_ids in var.secret_access_map : [
      for account_id in account_ids : {
        key         = "${secret_name}-${account_id}"
        secret_name = secret_name
        account_id  = account_id
      }
    ]
  ])

  secret_access_map = {
    for item in local.secret_access_entries : item.key => item
    if contains(keys(google_service_account.accounts), item.account_id)
  }
}

resource "google_project_iam_member" "service_account_roles" {
  for_each = local.role_binding_map

  project = var.project_id
  role    = each.value.role
  member  = "serviceAccount:${google_service_account.accounts[each.value.sa_id].email}"
}

resource "google_secret_manager_secret" "secrets" {
  for_each = var.secret_names

  project   = var.project_id
  secret_id = each.value

  replication {
    auto {}
  }

  depends_on = [google_project_service.required]
}

resource "google_secret_manager_secret_iam_member" "secret_accessors" {
  for_each = local.secret_access_map

  project   = var.project_id
  secret_id = google_secret_manager_secret.secrets[each.value.secret_name].secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.accounts[each.value.account_id].email}"
}

resource "google_artifact_registry_repository_iam_member" "cicd_writer" {
  count = contains(keys(google_service_account.accounts), var.cicd_account_id) ? 1 : 0

  project    = var.project_id
  location   = var.region
  repository = google_artifact_registry_repository.docker_repo.repository_id
  role       = "roles/artifactregistry.writer"
  member     = "serviceAccount:${google_service_account.accounts[var.cicd_account_id].email}"
}
