module "http_api" {
  source = "./modules/api-gateway"

  name  = local.config["api_gateway"]["name"]
  stage = local.config["api_gateway"]["stage"]
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
data "aws_cloudfront_origin_request_policy" "api_policy" {
  name = "AllViewerExceptHostHeader"
}
data "aws_cloudfront_cache_policy" "caching_optimized" {
  name = "CachingOptimized"
}
resource "aws_cloudfront_distribution" "api_distribution" {
  depends_on = [module.http_api]

  comment         = "msinfraops-poc-backend-${var.environment}"
  enabled         = true
  is_ipv6_enabled = true
  price_class     = "PriceClass_200"

  origin {
    domain_name = replace(replace(module.http_api.api_endpoint, "https://", ""), "http://", "")
    origin_id   = "poc-http-api-${var.environment}"
    origin_path = "/${module.http_api.stage}"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  default_cache_behavior {
    target_origin_id = "poc-http-api-${var.environment}"
    viewer_protocol_policy   = "redirect-to-https"
    allowed_methods          = ["GET", "HEAD", "OPTIONS", "PUT", "PATCH", "POST", "DELETE"]
    cached_methods           = ["GET", "HEAD"]
    compress                 = true
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }
}