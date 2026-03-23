import { OrganizationAssignedUser } from '../../entities/org-assigned-user';
import { IConfig } from '../config';
import { createDocument, SortKey } from '.';

/*
 * attr1 (string) - assignmentTargetId
 * attr2 (string) - subjectId
 * attr4 (number) - createAt
 */
export async function createUserOrganization(config: IConfig, applicationUser: OrganizationAssignedUser) {
  const document: Record<string, any> = { ...applicationUser };
  document._pk = applicationUser.assignmentTargetId;
  document._sk = `${SortKey.SubjectsAssigned}_${applicationUser.subjectId}`;
  document.attr1 = applicationUser.assignmentTargetId;
  document.attr2 = applicationUser.subjectId;
  document.attr4 = applicationUser.createdAt;

  await createDocument(config, document);
}
