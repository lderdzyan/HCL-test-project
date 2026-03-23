import { fromNullable, isSome } from 'fp-ts/lib/Option';
import { UserProfile } from '../../entities/user-profile';
import { IConfig } from '../config';
import { queryByAttr, SortKey } from '../dynamodb';
import { createOrgAssignedUserObject, createUserOrganization } from '../../entities/org-assigned-user';

export namespace AssignUserToMsNamespace {
  export async function createdAssignementForMs(config: IConfig) {
    const users: UserProfile[] = await loadAllActive(config);
    const msOrganization = 'cmfuyw24n000104l13nym9kqj';
    const bcOrganization = 'cmfv1rgkj000c04l71260g1y3';

    console.log(`Items size to update is ${users.length}`);

    for (const user of users) {
      await createUserOrganization(
        createOrgAssignedUserObject({
          assignmentTargetId: user.isB2b2c ? bcOrganization : msOrganization,
          subjectId: user.id,
        }),
      );
    }
    console.log('done');
  }

  async function loadAllActive(config: IConfig): Promise<UserProfile[]> {
    const items = await queryByAttr(
      config,
      'attr4',
      0,
      SortKey.UserProfile,
      '#attr > :attrValue',
      'attr4-index',
      undefined,
      3000,
    );

    const users: UserProfile[] = [];
    for (const item of items) {
      const fixedProduct = fromNullable(item as UserProfile);
      if (isSome(fixedProduct)) {
        users.push(fixedProduct.value);
      }
    }

    return users;
  }
}
