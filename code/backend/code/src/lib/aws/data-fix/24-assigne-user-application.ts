import { Application } from '../../entities/application';
import { UserProfile } from '../../entities/user-profile';
import { IConfig } from '../config';
import { queryByAttr, SortKey } from '../dynamodb';
import { fromNullable, isSome } from 'effect/Option';
import { UserType } from '../../constants';
import {
  ApplicationUser,
  createApplicationUser,
  createApplicationUserObject,
} from '../../entities/application-user';

export namespace AssignUserApplicationNamespace {
  export async function createdAssignementForApplications(config: IConfig) {
    const users: UserProfile[] = await loadAllActive(config);
    const applications: Application[] = await loadAllApplications(config);

    const admins = users.filter(
      (item: UserProfile) =>
        item.userTypes != null && Array.isArray(item.userTypes) && item.userTypes!.includes(UserType.MS_WEB_ADMIN),
    );

    const explorerApps = ['account-settings', 'mwi', 'guides', 'guides-second-version', 'mirror-reflection'];
    const adminApps = [...explorerApps, 'account-settings', 'cab-reports', 'intranet-profile'];

    console.log(`Items size to update is ${users.length} from whom ${admins.length} are admin`);

    const adminApplications = applications.filter((item: Application) => adminApps.includes(item.name!));
    const explorerApplications = applications.filter((item: Application) => explorerApps.includes(item.name!));
    const userAssignee = createInsertItems(admins, adminApplications);
    const explorersUserAssignee = createInsertItems(users, explorerApplications);
    userAssignee.push(...explorersUserAssignee);
    for (const ua of userAssignee) {
      await createApplicationUser(ua);
    }
    console.log('done');
  }

  function createInsertItems(users: UserProfile[], applications: Application[]): ApplicationUser[] {
    const applicationsId = applications.map((item) => item.id!);

    const items: ApplicationUser[] = [];
    for (const user of users) {
      for (const id of applicationsId) {
        items.push(
          createApplicationUserObject({
            assignmentTargetId: id,
            subjectId: user.id,
          }),
        );
      }
    }

    return items;
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
  async function loadAllApplications(config: IConfig): Promise<Application[]> {
    const items = await queryByAttr(config, 'attr4', 0, SortKey.Application, '#attr > :attrValue', 'attr4-index');

    const lists: Application[] = [];
    for (const item of items) {
      const fixedItem = fromNullable(item as Application);
      if (isSome(fixedItem)) {
        lists.push(fixedItem.value);
      }
    }

    return lists;
  }
}
