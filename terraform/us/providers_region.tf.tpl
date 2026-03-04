provider "insights" {
  api_key    = var.insights_api_key
  host       = local.insights_host
  project_id = var.insights_project_id
}
