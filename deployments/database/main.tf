locals {
  tables = [
    for t in yamldecode(file("${path.module}/config.yaml")).config.tables : {
      name          = t.name
      billingMode   = t.billingMode
      hashKey       = t.hashKey
      rangeKey      = lookup(t, "rangeKey", null)
      attributes    = t.attributes
      gsi           = lookup(t, "globalSecondaryIndex", [])
      enableRecovery = t.enableRecovery
    }
  ]
}

resource "aws_dynamodb_table" "tables" {
  for_each = {
    for table in local.tables :
    table.name => table
  }

  name = "${each.value.name}-${var.environment}"
  billing_mode = each.value.billingMode
  hash_key  = each.value.hashKey
  range_key = each.value.rangeKey

  dynamic "attribute" {
    for_each = each.value.attributes
    content {
      name = attribute.value.name
      type = attribute.value.type
    }
  }

dynamic "global_secondary_index" {
  for_each = each.value.gsi
  content {
    name            = global_secondary_index.value.name
    hash_key        = global_secondary_index.value.hashKey
    range_key       = lookup(global_secondary_index.value, "rangeKey", null)
    projection_type = global_secondary_index.value.projectionType
    read_capacity  = each.value.billingMode == "PROVISIONED" ? lookup(global_secondary_index.value, "readCapacity", null) : null
    write_capacity = each.value.billingMode == "PROVISIONED" ? lookup(global_secondary_index.value, "writeCapacity", null) : null
  }
}

  point_in_time_recovery {
    enabled = each.value.enableRecovery
  }
}