locals {
  config = yamldecode(file("${path.module}/config.yaml"))

  environment = var.environment

  lambda_map = { for l in local.config["lambda_functions"] : l.name => l }
}