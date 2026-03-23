import { RoleAssignedUser } from '../../entities/role-assigned-user';
import { createDocument, deleteByPartitionKey, queryByAttr, SortKey } from '.';
import { IConfig } from '../config';
import { fromNullable, isSome } from 'fp-ts/lib/Option';

/*
 * attr1 (string) - assignmentTargetId
 * attr2 (string) - subjectId
 * attr4 (number) - createAt
 */
export async function createUserRole(config: IConfig, applicationUser: RoleAssignedUser) {
  const document: Record<string, any> = { ...applicationUser };
  document._pk = applicationUser.assignmentTargetId;
  document._sk = `${SortKey.SubjectsAssigned}_${applicationUser.subjectId}`;
  document.attr1 = applicationUser.assignmentTargetId;
  document.attr2 = applicationUser.subjectId;
  document.attr4 = applicationUser.createdAt;

  await createDocument(config, document);
}

export async function loadAllByUserId(config: IConfig, id: string): Promise<RoleAssignedUser[]> {
  const items = await queryByAttr(
    config,
    'attr2',
    id,
    `${SortKey.SubjectsAssigned}_${id}`,
    '#attr = :attrValue',
    'attr2-index',
  );

  const data: RoleAssignedUser[] = [];
  for (const item of items) {
    const fixedItem = fromNullable(item as RoleAssignedUser);
    if (isSome(fixedItem)) {
      data.push(fixedItem.value);
    }
  }

  return data;
}
export async function deleteRoleAssigned(config: IConfig, roleId: string, userId: string) {
  await deleteByPartitionKey(config, roleId, `${SortKey.SubjectsAssigned}_${userId}`);
}
