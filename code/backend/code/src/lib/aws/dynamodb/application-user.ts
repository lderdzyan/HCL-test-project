import { createDocument, queryByAttr, SortKey } from '.';
import { ApplicationUser } from '../../entities/application-user';
import { IConfig } from '../config';
import { fromNullable, isSome } from 'fp-ts/lib/Option';

/*
 * attr1 (string) - assignmentTargetId
 * attr2 (string) - subjectId
 * attr4 (number) - createAt
 */
export async function createApplicationUser(config: IConfig, applicationUser: ApplicationUser) {
  const document: Record<string, any> = { ...applicationUser };
  document._pk = applicationUser.assignmentTargetId;
  document._sk = `${SortKey.SubjectsAssigned}_${applicationUser.subjectId}`;
  document.attr1 = applicationUser.assignmentTargetId;
  document.attr2 = applicationUser.subjectId;
  document.attr4 = applicationUser.createdAt;

  await createDocument(config, document);
}

export async function loadAllByUserId(config: IConfig, id: string): Promise<ApplicationUser[]> {
  const items = await queryByAttr(
    config,
    'attr2',
    id,
    `${SortKey.SubjectsAssigned}_${id}`,
    '#attr = :attrValue',
    'attr2-index',
  );

  const data: ApplicationUser[] = [];
  for (const item of items) {
    const fixedProduct = fromNullable(item as ApplicationUser);
    if (isSome(fixedProduct)) {
      data.push(fixedProduct.value);
    }
  }

  return data;
}
