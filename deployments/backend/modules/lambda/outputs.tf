output "lambda_arn" {
  value = aws_lambda_function.this.arn
}

output "lambda_name" {
  value = aws_lambda_function.this.function_name
}

output "role_arn" {
  value = aws_iam_role.lambda_exec.arn
}

output "role_id" {
  value = aws_iam_role.lambda_exec.id
}