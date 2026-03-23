variable "aws_region" {
  description = "Aws Region"
  type        = string
}

variable "bucket_name" {
  description = "State Bucket Name"
  type        = string
}

variable "environment" {
  description = "Environment"
  type        = string
}

variable "node_version" {
  description = "Node Version"
  type        = string 
}

variable "domain_zone" {
  description = "Route53 hosted zone name "
  type        = string
}

variable "domain" {
  description = "Full domain"
  type        = string
}