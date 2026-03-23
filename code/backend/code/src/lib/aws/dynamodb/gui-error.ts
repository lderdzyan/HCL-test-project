import { SortKey, createDocument } from '.';
import { GuiError } from '../../entities/gui-error';
import { IConfig } from '../config';

/*
 * attr1 (string) - personId
 * attr3 (string) - createdBy
 * attr4 (number) - createdAt
 */
export async function create(config: IConfig, guiError: GuiError) {
  const document: Record<string, any> = { ...guiError };
  document._pk = guiError.id;
  document._sk = SortKey.GuiError;
  document.attr1 = guiError.personId;
  document.attr3 = guiError.createdBy;
  document.attr4 = guiError.createdAt;

  await createDocument(config, document);
}
