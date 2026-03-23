import { UserType } from "../../constants";
import { UserProfile, loadAllUsers, updateUserProfile } from "../../entities/user-profile";

export namespace UserTypeMigration {
  export async function changeUserType() {
    const allUsers: UserProfile[] = await loadAllUsers();

    for (const user of allUsers) {
      const index = user.userTypes?.findIndex(item => item.toString() === 'MS_USER');
      if (index !== -1 && index != null) {
        user.userTypes![index] = UserType.MS_EXPLORER;
        await updateUserProfile(user, user.id!);
      }
    }
  }
}
