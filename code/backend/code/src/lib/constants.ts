export interface ICountry {
  cca3: string;
  region: string;
  name: {
    common: string;
  };
}
export enum UserType {
  MS_WEB_ADMIN = 'MS_WEB_ADMIN',
  MS_GUIDE = 'MS_GUIDE',
  MS_EXPLORER = 'MS_EXPLORER',
  MS_WEB_DEBUG = 'MS_WEB_DEBUG',
}
export enum RegistrationSource {
  MWI = 'mwi',
  BUILDER = 'builder',
  INDICATOR = 'indicator',
}
export enum GuidedDiscussionStatus {
  CREATED = 'created',
  SCHECHULED = 'schechuled',
  CANCELED = 'canceled',
  READY = 'ready',
  STARTED = 'started',
  FINISHED = 'finished',
  COMPLETED = 'completed',
  DELETED = 'deleted',
}
export enum GuidedDiscussionActionsStatus {
  CREATED = 'created',
  IN_PROGRESS = 'inProgress',
  FINISHED = 'finished',
}
export enum CalendlyEventType {
  InviteeCreated = 'invitee.created',
  InviteeCanceled = 'invitee.canceled',
  InviteeNoShowCreated = 'invitee_no_show.created',
  InviteeNoShowDeleted = 'invitee_no_show.deleted',
  RoutingFromSubmission = 'routing_form_submission.created',
}
export enum EventActionType {
  Create = 'create',
  Update = 'update',
}
export enum AuthLevel {
  Auth0,
  Auth1,
  Auth2,
  Auth3,
  Auth4,
}
export enum ProgressStatus {
  InProgress = 'in_progress',
  Processing = 'processing',
  Error = 'error',
  Done = 'done',
}
export enum GeneratingFileFormat {
  Unknown = 'unknown',
  CSV = 'csv',
  JSON = 'json',
}
export enum FileUploadTypes {
  AvatarImg = 'avatarImg',
  SpokenNameAudio = 'spokenNameAudio',
  WelcomeMessageAudio = 'welcomeMessageAudio',
}
export enum SortType {
  ASC = 'asc',
  DESC = 'desc',
}
export enum LoginStatus {
  Success = 'success',
  Failed = 'failed',
}
export enum FilterByColumns {
  CreatedAt = 'createdAt',
  StartedAt = 'startedAt',
  CompletedAt = 'completedAt',
  PurchasedAt = 'purchasedAt',
  FirstSectionCompletedAt = 'firstSectionCompletedAt',
  SecondSectionCompletedAt = 'secondSectionCompletedAt',
  ThirdSectionCompletedAt = 'thirdSectionCompletedAt',
}
export enum PaymentStatus {
  Pending = 'pending',
  Done = 'done',
  Failed = 'failded',
}
export enum ProductType {
  Taxamo = 'taxamo',
}
export enum AssignmentTargetType {
  Application = 'application',
  Role = 'role',
  Organization = 'organization',
}
export enum ProductShortName {
  Survey = 'survey',
  GuidedDiscussion = 'guidedDiscussion',
  WlfBuilder = 'wlfBuilder',
}
export enum SurveyAnswerProcessStatus {
  Created = 'created',
  New = 'new',
  InProgress = 'inProgress',
  NotReadyToBeCompleted = 'notReadyToBeCompleted',
  Finished = 'finished',
  Pending = 'pending',
  PayemenInProgress = 'paymentInProgress',
  Done = 'done',
  PaymentError = 'paymentError',
  ProcessingError = 'processingError',
}
export enum EmailCheckStatus {
  EMAIL_ALREADY_USED = 'EMAIL_ALREADY_USED',
  EMAIL_NOT_FOUND = 'EMAIL_NOT_FOUND',
  EMAIL_FOUND = 'EMAIL_FOUND',
  PASSWORD_NOT_SET = 'PASSWORD_NOT_SET',
}
export const EMAIL_REGEXP =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
export const SUPPORT_LINK = 'https://support.meaningsphere.com/hc/en-us';
export const SCHEDULE_LINK = 'https://calendly.com/d/29m-zqh-8rn/guided-discussion';
export const SUBSCRIBE_LINK = 'https://www.meaningsphere.com/sign-up-for-marketing-updates';
