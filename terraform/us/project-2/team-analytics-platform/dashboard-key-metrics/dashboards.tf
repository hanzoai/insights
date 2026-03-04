# =============================================================================
# Insights Dashboards Configuration
# =============================================================================
#
# This file demonstrates how to manage Insights dashboards using Terraform.
#
# For more information, see:
#   https://registry.terraform.io/providers/Insights/insights/latest/docs/resources/dashboard
# =============================================================================

# Terraform configuration for Insights dashboard
# Compatible with insights provider v1.0
# Source dashboard ID: 636477
import {
  to = insights_dashboard.team_analytics_platform_key_metrics
  id = "636477"
}

resource "insights_dashboard" "team_analytics_platform_key_metrics" {
  name = "[team-analytics-platform] Key metrics"
  pinned = true
  tags = ["managed-by:terraform"]
}
