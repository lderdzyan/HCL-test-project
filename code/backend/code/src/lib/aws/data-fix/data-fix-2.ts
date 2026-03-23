import { Email } from '../../entities/email';
import { UserProfile } from '../../entities/user-profile';
import { Logger } from '../../logger';
import { IConfig } from '../config';
import { SortKey, scanDataWithFilterSortKey, updateDocument } from '../dynamodb';
import { findByEmail } from '../dynamodb/user-profile';

export async function migrateEmailStatuses(config: IConfig) {
  const emailDetails = await scanDataWithFilterSortKey(config, SortKey.Email);

  Logger.info(`Found ${emailDetails.length} items to update.`);
  for (const email of emailDetails) {
    await updateEmailStatus(config, email as Email);
  }
  Logger.info('Done email updated.');
}
async function updateEmailStatus(config: IConfig, email: Email) {
  if (email.updatedBy == null) return;

  const userProfile: UserProfile | undefined = await findByEmail(config, email.emailAddr);
  if (userProfile == null || userProfile.pwd == null || userProfile.pwd.trim() === '') return;

  email.active = true;
  await updateDocument(config, email, ['active']);
}
