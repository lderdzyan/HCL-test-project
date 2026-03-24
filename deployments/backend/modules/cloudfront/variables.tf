variable "name" {
  type = string
}

variable "stage" {
  type = string
}

variable "region" {
  type = string
}

variable "environment" {
  type = string
}

variable "domain_name" {
  type    = string
  default = null
}

variable "hosted_zone_id" {
  type    = string
  default = null
}