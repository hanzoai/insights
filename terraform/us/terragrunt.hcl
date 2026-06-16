generate "locals_region.tf" {
  path      = "locals_region.tf"
  if_exists = "overwrite"
  contents  = file("locals_region.tf.tpl")
}

generate "variables_region.tf" {
  path      = "variables_region.tf"
  if_exists = "overwrite"
  contents  = file("variables_region.tf.tpl")
}

generate "providers_region.tf" {
  path      = "providers_region.tf"
  if_exists = "overwrite"
  contents  = file("providers_region.tf.tpl")
}

inputs = {
  insights_api_key = get_env("INSIGHTS_PROVIDER_API_KEY")
}
