import { UserProfile } from "../../entities/user-profile";
import { currentAt, currentOn } from "../../entity";
import { IConfig } from "../config";
import { IFilterData, queryByAttr, SortKey, updateDocument } from "../dynamodb";

export namespace AddMfaoptoutToUserMigraton {

  export async function addMfaOptout(config: IConfig) {
    const items = await loadAllUserWihtoutMfaOptout(config);

    for (const user of items) {
      if (user.mfaOptout == null) {
        user.mfaOptout = true;
        user.updatedOn = user.updatedOn ?? currentOn();
        user.updatedAt = user.updatedAt ?? currentAt();
        user.updatedBy = user.updatedBy ?? user.id!;

        console.log(user);

        await updateDocument(config, user, ['mfaOptout']);
      }
    }
  }

  async function loadAllUserWihtoutMfaOptout(config: IConfig): Promise<UserProfile[]> {
    const filters: IFilterData = {
      expression: 'attribute_not_exists(#filterAttr) or #filterAttr = :filterValue',
      names: { '#filterAttr': 'mfaOptout' },
      values: { ':filterValue': null }
    }
    const items = await queryByAttr(
      config,
      'attr1',
      "0",
      SortKey.UserProfile,
      '#attr > :attrValue',
      'attr1-index',
      filters
    );
    const users: UserProfile[] = [];

    for (const item of items) {
      const profile = _fixAttributes(item);
      if (profile != null) {
        users.push(profile);
      }
    }

    return users;
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

}
