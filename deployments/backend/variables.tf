variable "aws_region" {
  description = "Aws Region"
  type        = string
}
variable "environment" {
  type = string
}

variable "account_id" {
  type = string
}

variable "config" {
  type = any
  description = "Parsed configuration from config.yaml"
}