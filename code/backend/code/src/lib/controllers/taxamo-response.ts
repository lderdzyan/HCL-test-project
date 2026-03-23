import { createTaxamoResponse, TaxamoResponse } from "../entities/taxamo-response";

export namespace TaxamoResponseController {
  export async function addTaxamoResponse(taxamoResponse: TaxamoResponse) {
    await createTaxamoResponse(taxamoResponse);
  }
}
