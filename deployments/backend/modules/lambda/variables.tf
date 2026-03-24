variable "name" {
  type = string
}

variable "environment" {
  type = string
}

variable "handler" {
  type = string
}

variable "runtime" {
  type = string
}

variable "timeout" {
  type    = number
  default = 3
}

variable "policies" {
  description = "List of IAM policies"
  type = list(object({
    sid       = string
    type      = string
    actions   = list(string)
    resources = list(string)
  }))
  default = []
}

variable "environment_variables" {
  type    = map(string)
  default = {}
}

variable "region" {
  type = string
}

variable "account_id" {
  type = string
}