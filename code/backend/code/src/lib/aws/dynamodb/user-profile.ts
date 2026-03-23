import { fromNullable, isSome } from 'fp-ts/lib/Option';
import { IFilterData, SortKey, createDocument, queryByAttr, updateDocument } from '.';
import { UserProfile } from '../../entities/user-profile';
import { IConfig } from '../config';

/*
 * attr1 (string) - username
 * attr2 (string) - personId
 * attr3 (string) - email
 * attr4 (number) - createdAt
 */
export async function createUserProfile(config: IConfig, userProfile: UserProfile) {
  const document: Record<string, any> = { ...userProfile };
  document._pk = userProfile.id;
  document._sk = SortKey.UserProfile;
  document.attr1 = userProfile.username;
  document.attr2 = userProfile.personId;
  document.attr3 = userProfile.email;
  document.attr4 = userProfile.createdAt;

  await createDocument(config, document);
}
export async function countUsernameBeginsWith(config: IConfig, prefix: string): Promise<number> {
  const items = await queryByAttr(
    config,
    'attr1',
    prefix,
    SortKey.UserProfile,
    'begins_with (#attr, :attrValue)',
    'attr1-index',
  );

  return items.length;
}
export async function findAllByPid(config: IConfig, pid: string): Promise<UserProfile[]> {
  const items = await queryByAttr(config, 'attr2', pid, SortKey.UserProfile, '#attr = :attrValue', 'attr2-index');
  const profiles: UserProfile[] = [];
  for (const item of items) {
    const profile = _fixAttributes(item);
    if (profile != null) {
      profiles.push(profile);
    }
  }

  return profiles;
}
export async function findAllByPidAndEmail(config: IConfig, pid: string, email: string): Promise<UserProfile[]> {
  const filters: IFilterData = {
    expression: '#filterAttr = :filterValue',
    names: { '#filterAttr': 'attr3' },
    values: { ':filterValue': email }
  }
  const items = await queryByAttr(config, 'attr2', pid, SortKey.UserProfile, '#attr = :attrValue', 'attr2-index', filters);
  const profiles: UserProfile[] = [];
  for (const item of items) {
    const profile = _fixAttributes(item);
    if (profile != null) {
      profiles.push(profile);
    }
  }

  return profiles;
}
export async function findByUsername(config: IConfig, email: string): Promise<UserProfile | undefined> {
  const items = await queryByAttr(config, 'attr1', email, SortKey.UserProfile, '#attr = :attrValue', 'attr1-index');

  if (items.length === 0) return undefined;

  return _fixAttributes(items[0]);
}
export async function findByEmail(config: IConfig, email: string): Promise<UserProfile | undefined> {
  const items = await queryByAttr(config, 'attr3', email, SortKey.UserProfile, '#attr = :attrValue', 'attr3-index');

  if (items.length === 0) return undefined;

  return _fixAttributes(items[0]);
}
export async function findAllByEmail(config: IConfig, email: string): Promise<UserProfile[]> {
  const items = await queryByAttr(config, 'attr3', email, SortKey.UserProfile, '#attr = :attrValue', 'attr3-index');

  const profiles: UserProfile[] = [];
  for (const item of items) {
    const profile = _fixAttributes(item);
    if (profile != null) {
      profiles.push(profile);
    }
  }

  return profiles;
}
export async function loadAll(config: IConfig): Promise<UserProfile[]> {
  const items = await queryByAttr(config, 'attr4', 0, SortKey.UserProfile, '#attr > :attrValue', 'attr4-index', undefined, 3000);

  const users: UserProfile[] = [];
  for (const item of items) {
    const fixedProduct = fromNullable(item as UserProfile);
    if (isSome(fixedProduct)) {
      users.push(fixedProduct.value);
    }
  }

  return users;
}
export async function updateMfaOptout(config: IConfig, userProfile: UserProfile) {
  const document: Record<string, any> = { ...userProfile };
  document._pk = userProfile.id;
  document._sk = SortKey.UserProfile;

  await updateDocument(config, document, ['mfaOptout']);
}
export async function updatePassword(config: IConfig, userProfile: UserProfile) {
  const document: Record<string, any> = { ...userProfile };
  document._pk = userProfile.id;
  document._sk = SortKey.UserProfile;

  await updateDocument(config, document, ['pwd']);
}
export async function updatePasswordSecret(config: IConfig, userProfile: UserProfile) {
  const document: Record<string, any> = { ...userProfile };
  document._pk = userProfile.id;
  document._sk = SortKey.UserProfile;

  await updateDocument(config, document, ['pwdSecret']);
}
export async function update(config: IConfig, userProfile: UserProfile) {
  const document: Record<string, any> = { ...userProfile };
  document._pk = userProfile.id;
  document._sk = SortKey.UserProfile;
  document.attr3 = userProfile.email;

  const fields = ['pwd', 'email', 'mfaOptout', 'userTypes', 'country', 'countrySetDate',
    'mfaOptoutSetDate']
    .filter((field) => (userProfile as Record<string, any>)[field] != null);
  fields.push('attr3');

  await updateDocument(config, document, fields);
}
function _fixAttributes(item?: Record<string, any>): UserProfile | undefined {
  if (item == null) return undefined;

  const data = item as UserProfile;

  if (data.id == null) data.id = item._pk;
  if (data.username == null) data.username = item.attr1;
  if (data.personId == null) data.personId = item.attr2;
  if (data.email == null) data.email = item.attr3;
  if (data.createdAt == null) data.createdAt = item.attr4;

  return data;
}
