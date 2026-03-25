locals {
  config = yamldecode(file("${path.module}/config.yaml"))

  environment = local.config["env"]["environment"]

  lambda_map = { for l in local.config["lambda-functions"] : l.name => l }
}