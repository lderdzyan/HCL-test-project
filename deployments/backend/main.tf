module "http_api" {
  source = "./modules/api-gateway"

  name  = local.config["api-gateway"]["name"]
  stage = local.config["api-gateway"]["stage"]
}

module "server_lambdas" {
  for_each = { for k, v in local.lambda_map : k => v if v.type == "SERVER" }

  source      = "./modules/server-lambda"
  lambda      = each.value
  api_id      = module.http_api.api_id
  environment = local.environment
  region      = var.aws_region
  account_id  = var.account_id
}

module "publish_lambdas" {
  for_each = { for k, v in local.lambda_map : k => v if v.type == "PUBLISH" }

  source      = "./modules/publish-lambda"
  lambda      = each.value
  api_id      = module.http_api.api_id
  environment = local.environment
  region      = var.aws_region
  account_id  = var.account_id
}