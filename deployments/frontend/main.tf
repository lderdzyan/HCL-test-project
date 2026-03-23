resource "aws_s3_bucket" "my-s3" {
  bucket = var.bucket_name 
}

data "aws_iam_policy_document" "my-bucket-policy-document" {
  statement {
    sid    = "AllowCloudFrontServicePrincipalReadWrite"
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["cloudfront.amazonaws.com"]
    }

    actions = [
      "s3:GetObject",
      "s3:PutObject",
    ]

    resources = [
      "${aws_s3_bucket.my-s3.bucket.arn}/*",
    ]

    condition {
      test     = "StringEquals"
      variable = "AWS:SourceArn"
      values   = [aws_cloudfront_distribution.s3_distribution.arn]
    }
  }
}

resource "aws_s3_bucket_policy" "my-bucket-policy" {
  bucket = aws_s3_bucket.my-s3.bucket
  policy = data.aws_iam_policy_document.my-bucket-policy-document.json
}

resource "aws_cloudfront_origin_access_control" "my-oac" {
  name                              = "my-deployment-cloudfront-oac-${var.environment}"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_cloudfront_function" "poc-index-function" {
  name    = "poc-index-function-${var.environment}"
  runtime = "cloudfront-js-2.0"
  publish = true
  code    =  <<EOF
  function handler(event) {
    var request = event.request;
    var uri = request.uri;

    if (!uri.includes(".")) {
        request.uri = "/index.html";
    }

    return request;
}
EOF
}

resource "aws_cloudfront_function" "poc-disable-cache" {
  name    = "poc-disable-cache-${var.environment}"
  runtime = "cloudfront-js-2.0"
  publish = true
  code    =  <<EOF
    function handler(event) {
        var response = event.response;
        var request = event.request;
        var headers = response.headers;

        var uri = request.uri;

        if (uri.endsWith(".html") || uri.endsWith("/") || uri.endsWith("bootstrap.js")) {
          headers["cache-control"] = {
            value: "no-cache, no-store, must-revalidate"
          };
        }

        return response;
    }
EOF
}

locals {
  files = fileset("../../apps", "**")
}

resource "aws_s3_object" "apps" {
  for_each = { for f in local.files : f => f }
  bucket = aws_s3_bucket.my-s3.bucket.id
  key    = each.value
  source = "../apps/${each.value}"
}

resource "aws_cloudfront_distribution" "s3_distribution" {
  origin {
    domain_name              = aws_s3_bucket.my-s3.bucket_regional_domain_name
    origin_access_control_id = aws_cloudfront_origin_access_control.my-oac.id
    origin_id                = aws_s3_bucket.my-s3.id
  }

  enabled             = true
  is_ipv6_enabled     = true
  comment             = "Some comment"
  default_root_object = "index.html"


  default_cache_behavior {
    allowed_methods  = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = aws_s3_bucket.my-s3.id

    forwarded_values {
      query_string = false

      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "allow-all"
    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
  }

  ordered_cache_behavior {
    path_pattern     = "/content/immutable/*"
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD", "OPTIONS"]
    target_origin_id = aws_s3_bucket.my-s3.id

    forwarded_values {
      query_string = false
      headers      = ["Origin"]

      cookies {
        forward = "none"
      }
    }

    min_ttl                = 0
    default_ttl            = 86400
    max_ttl                = 31536000
    compress               = true
    viewer_protocol_policy = "redirect-to-https"
  }

  ordered_cache_behavior {
    path_pattern     = "/content/*"
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = aws_s3_bucket.my-s3.id

    forwarded_values {
      query_string = false

      cookies {
        forward = "none"
      }
    }

    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
    compress               = true
    viewer_protocol_policy = "redirect-to-https"
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }
#   aliases = ["${var.domain}.${var.domain_zone}"]
}
# data "aws_route53_zone" "domain_zone" {
#   name         = var.domain_zone
#   private_zone = false
# }
# resource "aws_route53_record" "poc_record" {
#   zone_id = data.aws_route53_zone.domain_zone.zone_id
#   name    = var.domain
#   type    = "A"

#   alias {
#     name                   = aws_cloudfront_distribution.s3_distribution.domain_name
#     zone_id                = aws_cloudfront_distribution.s3_distribution.hosted_zone_id
#     evaluate_target_health = false
#   }
# }
resource "null_resource" "cf_invalidate" {
  triggers = {
    run_id = timestamp()
  }

  provisioner "local-exec" {
    command = "aws cloudfront create-invalidation --distribution-id ${aws_cloudfront_distribution.s3_distribution.id} --paths '/*'"
  }

  depends_on = [
    aws_cloudfront_distribution.s3_distribution,
    null_resource.sync_apps
  ]
}