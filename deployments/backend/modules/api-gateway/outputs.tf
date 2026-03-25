output "api_id" {
  value = aws_apigatewayv2_api.http_api.id
}

output "execution_arn" {
  value = aws_apigatewayv2_api.http_api.execution_arn
}