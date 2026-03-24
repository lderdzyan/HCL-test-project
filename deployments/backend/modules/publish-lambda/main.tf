locals {
  has_path = try(var.lambda.path, null) != null
}

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

resource "aws_sqs_queue" "queue" {
  name                        = "${var.lambda.name}.fifo"
  fifo_queue                  = true
  content_based_deduplication = true
  visibility_timeout_seconds  = try(var.lambda.timeout, 30)
}

resource "aws_lambda_event_source_mapping" "sqs" {
  event_source_arn = aws_sqs_queue.queue.arn
  function_name    = module.lambda.lambda_arn
  batch_size       = try(var.lambda.batchSize, 1)
}

resource "aws_sns_topic" "topic" {
  count = local.has_path ? 0 : 1

  name                        = "${var.lambda.name}.fifo"
  fifo_topic                  = true
  content_based_deduplication = true
}

resource "aws_sns_topic_subscription" "sub" {
  count     = local.has_path ? 0 : 1
  topic_arn = aws_sns_topic.topic[0].arn
  protocol  = "sqs"
  endpoint  = aws_sqs_queue.queue.arn
}

resource "aws_sqs_queue_policy" "sns_to_sqs" {
  count     = local.has_path ? 0 : 1
  queue_url = aws_sqs_queue.queue.url

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect    = "Allow"
        Principal = { Service = "sns.amazonaws.com" }
        Action    = "sqs:SendMessage"
        Resource  = aws_sqs_queue.queue.arn
        Condition = { ArnEquals = { "aws:SourceArn" = aws_sns_topic.topic[0].arn } }
      }
    ]
  })
}

resource "aws_apigatewayv2_integration" "sqs" {
  count                 = local.has_path ? 1 : 0
  api_id                = var.api_id
  integration_type      = "AWS_PROXY"
  integration_subtype   = "SQS-SendMessage"
  payload_format_version = "1.0"
  request_parameters = {
    QueueUrl               = aws_sqs_queue.queue.url
    MessageBody            = "$request.body"
    MessageGroupId         = "default"
    MessageDeduplicationId = "$context.requestId"
  }
}

resource "aws_apigatewayv2_route" "route" {
  count     = local.has_path ? 1 : 0
  api_id    = var.api_id
  route_key = "${try(var.lambda.method, "POST")} ${startswith(var.lambda.path, "/") ? var.lambda.path : "/${var.lambda.path}"}"
  target    = "integrations/${aws_apigatewayv2_integration.sqs[0].id}"
}