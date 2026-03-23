import { IFilterData, SortKey, createDocument, queryByAttr, updateDocument } from '.';
import { Email } from '../../entities/email';
import { IConfig } from '../config';

/*
 * attr1 (string) - emailAddr
 * attr2 (string) - mfaProfileId
 * attr3 (string) - createdBy
 * attr4 (number) - createdAt
 */
export async function createEmail(config: IConfig, email: Email) {
  const document: Record<string, any> = { ...email };
  document._pk = email.id;
  document._sk = SortKey.Email;
  document.attr1 = email.emailAddr;
  document.attr2 = email.mfaProfileId;
  document.attr3 = email.createdBy;
  document.attr4 = email.createdAt;

  await createDocument(config, document);
}
export async function findByMfaProfileId(config: IConfig, id: string): Promise<Email | undefined> {
  const emailItems = await queryByAttr(config, 'attr2', id, SortKey.Email, '#attr = :attrValue', 'attr2-index');

  if (emailItems == null || emailItems.length === 0) return undefined;

  return _fixAttributes(emailItems[0]);
}
export async function findByAddress(config: IConfig, email: string): Promise<Email | undefined> {
  const emailItems = await queryByAttr(config, 'attr1', email, SortKey.Email, '#attr = :attrValue', 'attr1-index');

  if (emailItems == null || emailItems.length === 0) return undefined;

  return _fixAttributes(emailItems[0]);
}
export async function findByAddressAndMfaProfileId(config: IConfig, email: string, mfaProfielId: string): Promise<Email | undefined> {
  const filters: IFilterData = {
    expression: '#filterAttr = :filterValue',
    names: { '#filterAttr': 'attr2' },
    values: { ':filterValue': mfaProfielId }
  }
  const emailItems = await queryByAttr(config, 'attr1', email, SortKey.Email, '#attr = :attrValue', 'attr1-index', filters);

  if (emailItems == null || emailItems.length === 0) return undefined;

  return _fixAttributes(emailItems[0]);
}
export async function activate(config: IConfig, email: Email) {
  const document: Record<string, any> = { ...email };
  document._pk = email.id;
  document._sk = SortKey.Email;

  await updateDocument(config, document, ['active']);
}
function _fixAttributes(item?: Record<string, any>): Email | undefined {
  if (item == null) return undefined;

  const data = item as Email;

  if (data.id == null) data.id = item._pk;
  if (data.emailAddr == null) data.emailAddr = item.attr1;
  if (data.mfaProfileId == null) data.mfaProfileId = item.attr2;
  if (data.createdBy == null) data.createdBy = item.attr3;
  if (data.createdAt == null) data.createdAt = item.attr4;

  return data;
}
