locals {
  resolved_firestore_location = var.firestore_location != "" ? var.firestore_location : var.region

  resolved_web_domain = var.web_domain != "" ? var.web_domain : (
    var.apex_domain != "" ? "mvp.${var.apex_domain}" : ""
  )

  resolved_api_domain = var.api_domain != "" ? var.api_domain : (
    var.apex_domain != "" ? "api-mvp.${var.apex_domain}" : ""
  )

  resolved_api_base_url = var.api_base_url != "" ? var.api_base_url : (
    local.resolved_api_domain != "" ? "https://${local.resolved_api_domain}" : ""
  )
}
