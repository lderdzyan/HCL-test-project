import config from '../../config';
import * as AWSMigration from '../aws/migration';
import * as AWSFixData from '../aws/data-fix/data-fix-1';
import * as AWSEmailFix from '../aws/data-fix/data-fix-2';
import * as AWSDemographicData from '../aws/data-fix/data-fix-3';
import * as AWSSurveyAnswer from '../aws/data-fix/data-fix-4';
import { ApplicationMigration } from '../aws/data-fix/1-add-applications';
import { MomitEventController } from '../aws/data-fix/2-add-momit-event';
import * as AWSSurveyAnswerId from '../aws/data-fix/6-answer-surveyId-fix';
import { AddPackageToPaymentMigration } from '../aws/data-fix/7-add-package-to-payments';
import { UsernameFixMigration } from '../aws/data-fix/8-fix-usernames';
import { GuidedDiscussionEventsMigration } from '../aws/data-fix/10-add-guided-discussion-events';
import { AddMfaoptoutToUserMigraton } from '../aws/data-fix/11-add-mfaoptout-to-user';
import { ExtraPackageRemovingMigration } from '../aws/data-fix/12-remove-extra-packages';
import { AudioFileDurationMigration } from '../aws/data-fix/13-audio-file-duration';
import { AnswersCleanup } from '../aws/data-fix/14-answers-cleanup';
import { SecondVersionApplicationNamespace } from '../aws/data-fix/17-gd-version2-packages';
import { AddPackageIdToProduct } from '../aws/data-fix/20-add-packageId-to-product';
import { MirrorApplicationMigration } from '../aws/data-fix/21-mirror-related-data';
import { ReportDataAddNamespace } from '../aws/data-fix/22-report-data-adding';
import { PromoReportUpdateNamesNamespace } from '../aws/data-fix/23-add-names-in-promo-report';
import { WlfApplicationMigration } from '../aws/data-fix/25-wlf-related-data';
import { AssignUserApplicationNamespace } from '../aws/data-fix/24-assigne-user-application';
import { WlfPackageMigration } from '../aws/data-fix/26-wlf-related-date';
import { MOMApplicationMigration } from '../aws/data-fix/27-mom-related-data';
import { AssignUserToMomNamespace } from '../aws/data-fix/28-user-x-mom-application';
import { RoleMigration } from '../aws/data-fix/29-add-roles';
import { AssignUserRoleNamespace } from '../aws/data-fix/30-role-assigne-user';
import { DashboardAppMigration } from '../aws/data-fix/31-add-dashboard-app';
import { AssignUserToMsNamespace } from '../aws/data-fix/32-ms-org-assign-user';
import { GuidedDisucssionEventsDataFix } from '../aws/data-fix/33-gd-event-data-fix';
import { FixConceptApplicationNames } from '../aws/data-fix/34-fix-concept-application-names';

export async function addReportedValueToDemographicData() {
  switch (config.deploymenEnv) {
    case 'aws':
      await AWSMigration.addReportedValueToDemographicData(config.awsConfig!);
      break;
    case 'azure':
      throw Error('Not implemented yet.');
  }
}
export async function fixDataStructureV1() {
  switch (config.deploymenEnv) {
    case 'aws':
      await AWSFixData.migrateData(config.awsConfig!);
      break;
    case 'azure':
      throw Error('Not implemented yet.');
  }
}
export async function fixEmailDetailsStatuses() {
  switch (config.deploymenEnv) {
    case 'aws':
      await AWSEmailFix.migrateEmailStatuses(config.awsConfig!);
      break;
    case 'azure':
      throw Error('Not implemented yet.');
  }
}
// Remove duplicate pid attribute from demographic data in dynamoDB.
export async function removePidFromDemographicData() {
  switch (config.deploymenEnv) {
    case 'aws':
      await AWSDemographicData.removePidDemographicData(config.awsConfig!);
      break;
    case 'azure':
      throw Error('Not implemented yet.');
  }
}
export async function updateStatusesForAnswersDetails() {
  switch (config.deploymenEnv) {
    case 'aws':
      await AWSSurveyAnswer.migrateAnswerDetailsStatuses(config.awsConfig!);
      break;
    case 'azure':
      throw Error('Not implemented yet.');
  }
}

export async function addApplications(pid: string) {
  switch (config.deploymenEnv) {
    case 'aws':
      await ApplicationMigration.addApplications(pid);
      break;
    case 'azure':
      throw Error('Not implemented yet.');
  }
}

export async function addMomitEvent() {
  switch (config.deploymenEnv) {
    case 'aws':
      await MomitEventController.addMomitEvent(config.awsConfig!);
      break;
    case 'azure':
      throw Error('Not implemented yet.');
  }
}
export async function fixSurveyIdInAnswersDetails(surveyId: string) {
  switch (config.deploymenEnv) {
    case 'aws':
      await AWSSurveyAnswerId.migrateAnswerDetailsSurveyId(config.awsConfig!, surveyId);
      break;
    case 'azure':
      throw Error('Not implemented yet.');
  }
}
export async function createPackagePaymentRelations() {
  switch (config.deploymenEnv) {
    case 'aws':
      await AddPackageToPaymentMigration.addPackageToPayment(config.awsConfig!);
      break;
    case 'azure':
      throw Error('Not implemented yet.');
  }
}
export async function addEmailUsernameMomitEvents() {
  switch (config.deploymenEnv) {
    case 'aws':
      await MomitEventController.addEmailUsername(config.awsConfig!);
      break;
    case 'azure':
      throw Error('Not implemented yet.');
  }
}
export async function removedSpacesFromUsernames() {
  switch (config.deploymenEnv) {
    case 'aws':
      await UsernameFixMigration.fixUsernames(config.awsConfig!);
      break;
    case 'azure':
      throw Error('Not implemented yet.');
  }
}
export async function addGuidedDiscussionPaymentEvents() {
  switch (config.deploymenEnv) {
    case 'aws':
      await GuidedDiscussionEventsMigration.addPaymentEventsForGuidedDiscussion(config.awsConfig!);
      break;
    case 'azure':
      throw Error('Not implemented yet.');
  }
}
export async function addGuidedDiscussionEvents() {
  switch (config.deploymenEnv) {
    case 'aws':
      await GuidedDiscussionEventsMigration.addDiscussionEventsForGuidedDiscussion(config.awsConfig!);
      break;
    case 'azure':
      throw Error('Not implemented yet.');
  }
}

export async function userDetailsMfaOptoutFix() {
  switch (config.deploymenEnv) {
    case 'aws':
      await AddMfaoptoutToUserMigraton.addMfaOptout(config.awsConfig!);
      break;
    case 'azure':
      throw Error('Not implemented yet.');
  }
}
export async function findAndRemoveUnusedPackages() {
  switch (config.deploymenEnv) {
    case 'aws':
      await ExtraPackageRemovingMigration.findAndRemoveUnusedPackages();
      break;
    case 'azure':
      throw Error('Not implemented yet.');
  }
}
export async function migrateAudioFileDurations() {
  switch (config.deploymenEnv) {
    case 'aws':
      await AudioFileDurationMigration.addAudioFileDuration();
      break;
    case 'azure':
      throw Error('Not implemented yet.');
  }
}
export async function doSurveyAnswersCleanup() {
  switch (config.deploymenEnv) {
    case 'aws':
      await AnswersCleanup.doCleanup(config.awsConfig!);
      break;
    case 'azure':
      throw Error('Not implemented yet.');
  }
}
export async function addSecondPhaseApplication(pid: string) {
  switch (config.deploymenEnv) {
    case 'aws':
      await SecondVersionApplicationNamespace.createNewApplicationWithPackages(pid);
      break;
    case 'azure':
      throw Error('Not implemented yet.');
  }
}
export async function addMirrorApplication(pid: string) {
  switch (config.deploymenEnv) {
    case 'aws':
      await MirrorApplicationMigration.addApplications(pid);
      break;
    case 'azure':
      throw Error('Not implemented yet.');
  }
}
export async function addPackageIdToProduct() {
  switch (config.deploymenEnv) {
    case 'aws':
      await AddPackageIdToProduct.migrate(config.awsConfig!);
      break;
    case 'azure':
      throw Error('Not implemented yet.');
  }
}
export async function addPromoReportData() {
  switch (config.deploymenEnv) {
    case 'aws':
      await ReportDataAddNamespace.addReportData(config.awsConfig!);
      break;
    case 'azure':
      throw Error('Not implemented yet.');
  }
}
export async function updateNamesInPromoReportData() {
  switch (config.deploymenEnv) {
    case 'aws':
      await PromoReportUpdateNamesNamespace.updateReportData(config.awsConfig!);
      break;
    case 'azure':
      throw Error('Not implemented yet.');
  }
}
export async function addWlfApplication(pid: string) {
  switch (config.deploymenEnv) {
    case 'aws':
      await WlfApplicationMigration.addApplications(pid);
      break;
    case 'azure':
      throw Error('Not implemented yet.');
  }
}
export async function addWlfPackage(pid: string) {
  switch (config.deploymenEnv) {
    case 'aws':
      await WlfPackageMigration.addPackageProduct(pid);
      break;
    case 'azure':
      throw Error('Not implemented yet.');
  }
}
export async function addMOMApp(pid: string) {
  switch (config.deploymenEnv) {
    case 'aws':
      await MOMApplicationMigration.addApplications(pid);
      break;
    case 'azure':
      throw Error('Not implemented yet.');
  }
}
export async function addMDashboardApp(pid: string) {
  switch (config.deploymenEnv) {
    case 'aws':
      await DashboardAppMigration.addApplications(pid);
      break;
    case 'azure':
      throw Error('Not implemented yet.');
  }
}
export async function assigneUserToApplication() {
  switch (config.deploymenEnv) {
    case 'aws':
      await AssignUserApplicationNamespace.createdAssignementForApplications(config.awsConfig!);
      break;
    case 'azure':
      throw Error('Not implemented yet.');
  }
}
export async function assigneUserToMOMAndWlf() {
  switch (config.deploymenEnv) {
    case 'aws':
      await AssignUserToMomNamespace.createdAssignementForApplications(config.awsConfig!);
      break;
    case 'azure':
      throw Error('Not implemented yet.');
  }
}
export async function addRolesToDB(pid: string) {
  switch (config.deploymenEnv) {
    case 'aws':
      await RoleMigration.addRoles(pid);
      break;
    case 'azure':
      throw Error('Not implemented yet.');
  }
}
export async function assigneUserToRole() {
  switch (config.deploymenEnv) {
    case 'aws':
      await AssignUserRoleNamespace.createdAssignementForRoles(config.awsConfig!);
      break;
    case 'azure':
      throw Error('Not implemented yet.');
  }
}
export async function assigneUserToMsOrg() {
  switch (config.deploymenEnv) {
    case 'aws':
      await AssignUserToMsNamespace.createdAssignementForMs(config.awsConfig!);
      break;
    case 'azure':
      throw Error('Not implemented yet.');
  }
}
export async function fixGDEventData() {
  switch (config.deploymenEnv) {
    case 'aws':
      await GuidedDisucssionEventsDataFix.fixData();
      break;
    case 'azure':
      throw Error('Not implemented yet.');
  }
}
export async function renameAppNamesforConcepts() {
  switch (config.deploymenEnv) {
    case 'aws':
      await FixConceptApplicationNames.renameApplications();
      break;
    case 'azure':
      throw Error('Not implemented yet.');
  }
}
