resource "google_firestore_database" "primary" {
  project     = var.project_id
  name        = var.database_id
  location_id = var.location_id
  type        = "FIRESTORE_NATIVE"

  lifecycle {
    prevent_destroy = var.prevent_destroy
  }
}
