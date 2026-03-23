import { SortKey, createDocument, findByPartitionKey, queryByAttr } from '.';
import { MfaProfile } from '../../entities/mfa-profile';
import { IConfig } from '../config';

/*
 * attr1 (string) - personId
 * attr3 (string) - createdBy
 * attr4 (number) - createdAt
 */
export async function createMfaProfile(config: IConfig, mfaProfile: MfaProfile) {
  const document: Record<string, any> = { ...mfaProfile };
  document._pk = mfaProfile.id;
  document._sk = SortKey.MfaProfile;
  document.attr1 = mfaProfile.personId;
  document.attr3 = mfaProfile.createdBy;
  document.attr4 = mfaProfile.createdAt;

  await createDocument(config, document);
}
export async function findAllByPid(config: IConfig, pid: string): Promise<MfaProfile[]> {
  const items = await queryByAttr(config, 'attr1', pid, SortKey.MfaProfile, '#attr = :attrValue', 'attr1-index');
  const mfaProfiles: MfaProfile[] = [];

  for (const item of items) {
    const mfaProfile = _fixAttributes(item);
    if (mfaProfile != null) {
      mfaProfiles.push(mfaProfile);
    }
  }
  
  return mfaProfiles;
}
export async function findById(config: IConfig, id: string): Promise<MfaProfile | undefined> {
  return _fixAttributes(await findByPartitionKey(config, id, SortKey.MfaProfile));
}
export async function findByPersonId(config: IConfig, personId: string): Promise<MfaProfile | undefined> {
  const items = await queryByAttr(config, 'attr1', personId, SortKey.MfaProfile, '#attr = :attrValue', 'attr1-index');

  if (items == null || items.length === 0) return undefined;

  return _fixAttributes(items[0]);
}
function _fixAttributes(item?: Record<string, any>): MfaProfile | undefined {
  if (item == null) return undefined;

  const data = item as MfaProfile;

  if (data.id == null) data.id = item._pk;
  if (data.personId == null) data.personId = item.attr1;
  if (data.createdBy == null) data.createdBy = item.attr3;
  if (data.createdAt == null) data.createdAt = item.attr4;

  return data;
}
