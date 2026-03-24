resource "aws_cloudfront_distribution" "api_distribution" {
  comment             = "msinfraops-poc-backend-${var.environment}"
  enabled             = true
  is_ipv6_enabled     = true
  price_class         = "PriceClass_200"

  origins {
    domain_name = "${aws_apigatewayv2_api.http_api.id}.execute-api.${var.region}.amazonaws.com"
    origin_id   = "poc-http-api-origin-${var.environment}"
    origin_path = "/${var.stage}"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  default_cache_behavior {
    target_origin_id       = "poc-http-api-origin-${var.environment}"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD", "OPTIONS", "PUT", "PATCH", "POST", "DELETE"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true
    cache_policy_id        = "4135ea2d-6df8-44a3-9df3-4b5a84be39ad"
    origin_request_policy_id = "b689b0a8-53d0-40ab-baf2-68738e2966ac"
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