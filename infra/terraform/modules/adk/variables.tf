variable "project_id" {
  type = string
}

variable "region" {
  type = string
}

variable "queue_name" {
  type = string
}

variable "max_dispatches_per_second" {
  type = number
}

variable "max_concurrent_dispatches" {
  type = number
}

variable "max_attempts" {
  type = number
}

variable "min_backoff_seconds" {
  type = number
}

variable "max_backoff_seconds" {
  type = number
}
