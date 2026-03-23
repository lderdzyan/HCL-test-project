import { UserProfile } from '../../entities/user-profile';
import { IConfig } from '../config';
import { createApplicationUser, createApplicationUserObject } from '../../entities/application-user';
import { queryByAttr, SortKey } from '../dynamodb';
import { fromNullable, isSome } from 'fp-ts/lib/Option';

export namespace AssignUserToMomNamespace {
  export async function createdAssignementForApplications(config: IConfig) {
    const users: UserProfile[] = await loadAllActive(config);

    console.log(`Items size to update is ${users.length} from whom ${users.length} are admin`);

    for (const user of users) {
      // WLF
      await createApplicationUser(
        createApplicationUserObject({
          assignmentTargetId: 'cmck95v2h000107lefqcahgof',
          subjectId: user.id,
        }),
      );
      // MOM
      await createApplicationUser(
        createApplicationUserObject({
          assignmentTargetId: 'cmdfs3g5z000007l17s5g5qvu',
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
