
output "worker_name" {
  description = "Deployed Cloudflare Worker name"
  value       = cloudflare_workers_script.student_task_manager.id
}

output "worker_health_url" {
  description = "Worker health-check endpoint"
  value       = "https://${var.worker_name}.${var.cloudflare_account_id}.workers.dev/api/health"
}
