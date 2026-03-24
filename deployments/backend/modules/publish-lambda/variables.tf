variable "lambda" {
  type = object({
    name        = string
    handler     = string
    runtime     = string
    timeout     = optional(number)
    path        = optional(string)
    method      = optional(string)
    batchSize   = optional(number)
    policies    = list(object({
      sid       = string
      type      = string
      actions   = list(string)
      resources = list(string)
    }))
    environment = optional(map(string))
  })
}

variable "environment" {}
variable "region" {}
variable "account_id" {}
variable "api_id" {
  type = string
}