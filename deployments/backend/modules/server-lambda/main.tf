module "lambda" {
  source = "../lambda"

  name        = var.lambda.name
  handler     = var.lambda.handler
  runtime     = var.lambda.runtime
  timeout     = try(var.lambda.timeout, 3)
  environment = var.environment
  region      = var.region
  account_id  = var.account_id

  policies = var.lambda.policies

  environment_variables = merge(
    {
      MS_DEPLOY_ENV = var.environment
    },
    try(var.lambda.environment, {})
  )
}

resource "aws_lambda_permission" "api_invoke" {
  function_name = module.lambda.lambda_arn
  action        = "lambda:InvokeFunction"
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.http_api.execution_arn}/*"
}

resource "aws_apigatewayv2_integration" "lambda" {
  api_id                 = var.api_id
  integration_type       = "AWS_PROXY"
  integration_uri        = module.lambda.lambda_invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "lambda_route" {
  api_id    = var.api_id
  route_key = "ANY ${var.lambda.path}"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}