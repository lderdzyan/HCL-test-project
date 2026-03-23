import { UserProfile } from '../../entities/user-profile';
import { IConfig } from '../config';
import { queryByAttr, SortKey } from '../dynamodb';
import { fromNullable, isSome } from 'effect/Option';
import {
  createRoleAssignedUserObject,
  createUserRole,
  RoleAssignedUser,
} from '../../entities/role-assigned-user';
import { isValidArray } from '../../utils/array-utils';

export namespace AssignUserRoleNamespace {
  export async function createdAssignementForRoles(config: IConfig) {
    const users: UserProfile[] = await loadAllActive(config);
    enum RoleTypeIds {
      MS_EXPLORER = 'cmeb34aaf000907k05a4adcbo',
      MS_GUIDE = 'cmeb36jw1000a07k01yytaz2x',
      MS_WEB_DEBUG = 'cmeb36xkd000b07k0b8qh5jvb',
      MS_WEB_ADMIN = 'cmeb37aiu000c07k05ds2b4ca',
    }

    console.log(`Items size to update is ${users.length}`);

    const items: RoleAssignedUser[] = [];
    for (const user of users) {
      if (isValidArray(user.userTypes)) {
        for (const roleName of user.userTypes!) {
          if (RoleTypeIds[roleName] != null) {
            items.push(
              createRoleAssignedUserObject({
                assignmentTargetId: RoleTypeIds[roleName],
                subjectId: user.id,
              }),
            );
          } else {
            console.log(user);
          }
        }
      } else {
        items.push(
          createRoleAssignedUserObject({
            assignmentTargetId: RoleTypeIds.MS_EXPLORER,
            subjectId: user.id,
          }),
        );
      }
    }
    for (const item of items) {
      await createUserRole(item);
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
