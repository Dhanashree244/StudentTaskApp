
resource "cloudflare_workers_kv_namespace" "student_tasks" {
  account_id = var.cloudflare_account_id
  title      = "student_tasks"
}

resource "cloudflare_workers_script" "student_task_manager" {
  account_id         = var.cloudflare_account_id
  script_name        = var.worker_name
  content_file       = "${path.module}/../application/worker.js"
  content_sha256     = filesha256("${path.module}/../application/worker.js")
  main_module        = "worker.js"
  compatibility_date = "2026-10-19"

  bindings = [{
    name         = "TASKS_KV"
    type         = "kv_namespace"
    namespace_id = cloudflare_workers_kv_namespace.student_tasks.id
  }]
}

resource "cloudflare_workers_script_subdomain" "student_task_manager" {
  account_id       = var.cloudflare_account_id
  script_name      = cloudflare_workers_script.student_task_manager.id
  enabled          = true
  previews_enabled = false
}
