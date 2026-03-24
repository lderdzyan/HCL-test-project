resource "aws_iam_role" "lambda_exec" {
  name = "${var.name}-${var.environment}-exec-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "policy_attachment" {
  role       = aws_iam_role.lambda_exec.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

locals {
  interpolated_policies = flatten([
    for p in var.policies : [
      for r in p.resources : {
        sid     = p.sid
        actions = p.actions

        resources = (
          p.type == "DynamoDB"
          ? [
              "arn:aws:dynamodb:${var.region}:${var.account_id}:table/${r}-${var.environment}",
              "arn:aws:dynamodb:${var.region}:${var.account_id}:table/${r}-${var.environment}/index/*"
            ]
          : ["*"]
        )
      }
    ]
  ])
}

resource "aws_iam_role_policy" "custom" {
  count = length(local.interpolated_policies) > 0 ? 1 : 0

  name = "${var.name}-${var.environment}-policy"
  role = aws_iam_role.lambda_exec.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      for p in local.interpolated_policies : {
        Sid      = p.sid
        Effect   = "Allow"
        Action   = p.actions
        Resource = p.resources
      }
    ]
  })
}

resource "aws_lambda_function" "lambda_creation" {
  function_name = "${var.name}-${var.environment}"
  role          = aws_iam_role.lambda_exec.arn
  handler       = var.handler
  runtime       = var.runtime
  timeout       = var.timeout

  filename = "${path.root}/lambdas/${var.name}.zip"

    source_code_hash = filebase64sha256("${path.root}/lambdas/${var.name}.zip")
    depends_on = concat(
    [aws_iam_role_policy_attachment.policy_attachment],
    aws_iam_role_policy.custom
    )
    environment {
        variables = var.environment_variables
    }
}

