import { fromNullable, isSome } from "fp-ts/lib/Option";
import { UserProfile } from "../../entities/user-profile";
import { IConfig } from "../config";
import { queryByAttr, SortKey, updateDocument } from "../dynamodb";

export namespace UsernameFixMigration {

  export async function fixUsernames(config: IConfig) {
    const users: UserProfile[] = await getUsers(config);

    console.log(`Found ${users.length} items.`);
    for (const user of users) {
      if (user.username != null && hasSpaces(user.username)) {
        console.log(`Fixing ${user.username}`);
        user.username = user.username.replace(/\s+/g, '');

        await updateUsername(config, user);
      }
    }
  }

  const hasSpaces = (str: string): boolean => {
    return str.includes(' ');
  };

  async function getUsers(config: IConfig): Promise<UserProfile[]> {
    const items = await queryByAttr(config, 'attr4', 0, SortKey.UserProfile, '#attr > :attrValue', 'attr4-index');

    const users: UserProfile[] = [];
    for (const item of items) {
      const fixedUser = fromNullable(item as UserProfile);
      if (isSome(fixedUser)) {
        users.push(fixedUser.value);
      }
    }

    return users;
  }

  async function updateUsername(config: IConfig, userProfile: UserProfile) {
    const document: Record<string, any> = { ...userProfile };
    document._pk = userProfile.id;
    document._sk = SortKey.UserProfile;
    document.attr1 = userProfile.username;

    await updateDocument(config, document, ['username', 'attr1']);
  }
}
