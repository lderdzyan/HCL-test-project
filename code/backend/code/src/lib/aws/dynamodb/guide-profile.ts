import { DeletedSortKey, SortKey, createDocument, deleteByPartitionKey, findByPartitionKey, queryByAttr, removeAttr, updateDocument } from '.';
import { GuideProfile } from '../../entities/guide-profile';
import { IConfig } from '../config';
import { Option, fromNullable, isSome } from "fp-ts/Option";

/*
 * attr1 (string) - calendlyUserId
 * attr2 (string) - deleted
 * attr3 (string) - createdBy
 * attr4 (number) - createdAt
 */
export async function findById(config: IConfig, id: string): Promise<Option<GuideProfile>> {
  return fromNullable(await findByPartitionKey(config, id, SortKey.GuideProfile) as GuideProfile);
}
export async function createGuideProfile(config: IConfig, guideProfile: GuideProfile) {
  const document: Record<string, any> = { ...guideProfile };
  document._pk = guideProfile.id;
  document._sk = SortKey.GuideProfile;
  document.attr2 = guideProfile.deleted;
  document.attr3 = guideProfile.createdBy;
  document.attr4 = guideProfile.createdAt;

  await createDocument(config, document);
}
export async function updateGuideProfile(config: IConfig, profile: GuideProfile, fieldsToUpdate: string[]) {
  const document: Record<string, any> = { ...profile };
  document._pk = profile.id;
  document._sk = SortKey.GuideProfile;

  await updateDocument(config, document, fieldsToUpdate);
}
export async function removeFields(config: IConfig, id: string, fieldsToRemove: string[]) {
  await removeAttr(config, id, SortKey.GuideProfile, fieldsToRemove.join(','));
}
export async function loadAll(config: IConfig): Promise<GuideProfile[]> {
  const items = await queryByAttr(config, 'attr4', 0, SortKey.GuideProfile, '#attr > :attrValue', 'attr4-index');

  const guides: GuideProfile[] = [];
  for (const item of items) {
    const fixedGuideProfile = fromNullable(item as GuideProfile);
    if (isSome(fixedGuideProfile)) {
      guides.push(fixedGuideProfile.value);
    }
  }

  return guides;
}
export async function createDeletedGuide(config: IConfig, data: GuideProfile) {
  const document: Record<string, any> = { ...data };
  document._pk = data.id;
  document._sk = DeletedSortKey.GuideProfile;
  document.attr3 = data.createdBy;
  document.attr4 = data.createdAt;

  await createDocument(config, document);
}
export async function deleteGuide(config: IConfig, id: string) {
  await deleteByPartitionKey(config, id, SortKey.GuideProfile);
}
