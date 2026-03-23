import { createDocument, SortKey } from ".";
import { TaxamoResponse } from "../../entities/taxamo-response";
import { IConfig } from "../config";

/*
 * attr1 (string) - stripeId
 * attr2 (string) - taxamoTransactionId
 * attr3 (string) - personId
 * attr4 (number) - createdAt
 */
export async function createTaxamoResponse(config: IConfig, taxamoResponse: TaxamoResponse) {
  const document: Record<string, any> = { ...taxamoResponse };
  document._pk = taxamoResponse.id;
  document._sk = SortKey.TaxamoResponse;
  document.attr1 = taxamoResponse.stripeId;
  document.attr2 = taxamoResponse.taxamoTransactionId;
  document.attr3 = taxamoResponse.personId;
  document.attr4 = taxamoResponse.createdAt;

  await createDocument(config, document);
}
