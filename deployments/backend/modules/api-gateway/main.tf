resource "aws_apigatewayv2_api" "http_api" {
  name          = var.name
  protocol_type = "HTTP"

  cors_configuration {
    allow_headers     = ["Authorization", "Content-Type", "X-Amz-Date", "X-Api-Key", "X-Amz-Security-Token"]
    allow_methods     = ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"]
    allow_origins     = ["*"]
    expose_headers    = []
    max_age           = 86400
  }
}

resource "aws_apigatewayv2_stage" "http_api_stage" {
  api_id      = aws_apigatewayv2_api.http_api.id
  name        = var.stage
  auto_deploy = true
}