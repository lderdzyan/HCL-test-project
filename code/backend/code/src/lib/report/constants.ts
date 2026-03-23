import {
  BrandAndCommsResult,
  LoginReportResult,
  DemograchicResult,
  BrandAndCommsEventResult,
  GuideDiscussionResult,
  MomitReportResult,
  ResponseReportResult,
  PromoReportResult,
  MirrorReflectionResult,
  FreePromoReportResult,
  CountFunnelReportResult,
  WorkLifeReportResult,
  WlfBuilderReportResult,
  WLFAnonymousResult,
} from '../controllers/reports';

export const ageGap: { [key: string]: number } = {
  '18-24 years': 1,
  '25-34 years': 2,
  '35-44 years': 3,
  '45-54 years': 4,
  '55-64 years': 5,
  '65 years and over': 6,
};

export const eduaction: { [key: string]: number } = {
  'Secondary school': 1,
  'College/technical degree': 2,
  'Masters level and beyond': 3,
};

export const gender: { [key: string]: number } = {
  Male: 1,
  Female: 2,
  Other: 3,
};

export const region: { [key: string]: number } = {
  Asia: 1,
  India: 2,
  'Middle East': 3,
  'North Africa': 4,
  'Sub Saharan Africa': 5,
  'North America': 6,
  'Central America': 7,
  'South America': 8,
  Europe: 9,
  Eurasia: 10,
  Oceania: 11,
};

export const industry: { [key: string]: number } = {
  'Agriculture, Forestry, Fishing and Hunting': 1,
  'Mining, Quarrying, and Oil and Gas Extraction': 2,
  Utilities: 3,
  Construction: 4,
  Manufacturing: 5,
  'Wholesale Trade': 6,
  'Retail Trade': 7,
  'Transportation and Warehousing': 8,
  Information: 9,
  'Finance and Insurance': 10,
  'Real Estate and Rental and Leasing': 11,
  'Professional, Scientific, and Technical Services': 12,
  'Management of Companies and Enterprises': 13,
  'Administrative and Support and Waste Management and Remediation Services': 14,
  'Educational Services': 15,
  'Health Care and Social Assistance': 16,
  'Arts, Entertainment, and Recreation': 17,
  'Accommodation and Food Services': 18,
  'Other Services (except Public Administration)': 19,
  'Public Administration': 20,
};

export const occupation: { [key: string]: number } = {
  'Management Occupations': 1,
  'Business and Financial Operations Occupations': 2,
  'Computer and Mathematical Occupations': 3,
  'Architecture and Engineering Occupations': 4,
  'Life, Physical, and Social Science Occupations': 5,
  'Community and Social Service Occupations': 6,
  'Legal Occupations': 7,
  'Educational Instruction and Library Occupations': 8,
  'Arts, Design, Entertainment, Sports, and Media Occupations': 9,
  'Healthcare Practitioners and Technical Occupations': 10,
  'Healthcare Support Occupations': 11,
  'Protective Service Occupations': 12,
  'Food Preparation and Serving Related Occupations': 13,
  'Building and Grounds Cleaning and Maintenance Occupations': 14,
  'Personal Care and Service Occupations': 15,
  'Sales and Related Occupations': 16,
  'Office and Administrative Support Occupations': 17,
  'Farming, Fishing, and Forestry Occupations': 18,
  'Construction and Extraction Occupations': 19,
  'Installation, Maintenance, and Repair Occupations': 20,
  'Production Occupations': 21,
  'Transportation and Material Moving Occupations': 22,
  'Military Specific Occupations': 23,
};

export enum AcceptTypes {
  TextCsv = 'text/csv',
  TextCsvPresent = 'text/csv; header=present',
  ApplicationJson = 'application/json',
  ApplicationJsonUtf8 = 'application/json; charset=utf8',
  ApplicationJsonVnd = 'application/vnd.meaningsphere.api+json; version=1',
}
export enum GuidedReportCompletionStatus {
  Unscheduled = 'unscheduled',
  Scheduled = 'scheduled',
  InProgress = 'inProgress',
  Complete = 'complete',
  Cancel = 'cancel',
}
export enum ReportType {
  BrandAndComms = 'brandAndComms',
  Momit = 'momit',
  Demographic = 'demographic',
  LoginReport = 'loginReport',
  BrandAndCommsEvent = 'brandAndCommsEvent',
  GuidedDiscussion = 'guidedDiscussion',
  ResponseReport = 'responseReport',
  PromoReport = 'promoReport',
  FreePromoReport = 'freePromoReport',
  MirrorReflectionReport = 'mirrorReflectionReport',
  CountFunnelReport = 'countFunnelReport',
  WorkLifeReport = 'worklifeReport',
  WlfBuilderReport = 'momReport',
  WlfAnonymousReport = 'wlfAnonymousReport',
}
export enum BrandAndCommsEvents {
  Started = 'started',
  EmailVerifiedFailed = 'emailVerifiedFailed',
  Completed = 'completed',
  EmailVerified = 'emailVerified',
  PasswordCreated = 'passwordCreated',
  CountrySelected = 'countrySelected',
}
export enum WlfEvents {
  Started = 'started',
  Completed = 'completed',
  EmailVerified = 'emailVerified',
  WarmUpCompleted = 'warmUpCompleted',
  TargetAreaCompleted = 'targetAreaCompleted',
  TrainingPlanCompleted = 'trainingPlanCompleted',
  PdfDownloaded = 'pdfDownloaded',
}
export enum WlfBuilderEvents {
  PurchaseDate = 'purchaseDate',
  Completed = 'completed',
  FirstModule = 'firstModuleCompleted',
  SecondModuleCompleted = 'secondModuleCompleted',
  ThirdModuleCompleted = 'ThirdModuleCompleted',
  RegistrationSource = 'registrationSource',
}
export enum ColumnType {
  String,
  Date,
  Number,
}
export type ReportColumn<T> = { name: T; type: ColumnType };
export const demographicReportColumns: ReportColumn<keyof DemograchicResult>[] = [
  { name: 'userId', type: ColumnType.String },
  { name: 'submissionDate', type: ColumnType.Date },
  { name: 'ageGroup', type: ColumnType.String },
  { name: 'highestEducationLevel', type: ColumnType.String },
  { name: 'gender', type: ColumnType.String },
  { name: 'regionOfBirth', type: ColumnType.String },
  { name: 'regionWhereYouLive', type: ColumnType.String },
  { name: 'industry', type: ColumnType.String },
  { name: 'occupation', type: ColumnType.String },
  { name: 'responsesToSurvey', type: ColumnType.String },
];
export const brandAndCommsColumns: ReportColumn<keyof BrandAndCommsResult>[] = [
  { name: 'email', type: ColumnType.String },
  { name: 'pid', type: ColumnType.String },
  { name: 'username', type: ColumnType.String },
  { name: 'marketingOptin', type: ColumnType.String },
  { name: 'uid', type: ColumnType.String },
  { name: 'taxamoPurchaseDate', type: ColumnType.Date },
  { name: 'completedDate', type: ColumnType.Date },
  { name: 'taxamoCountry', type: ColumnType.String },
  { name: 'userRegistrationDate', type: ColumnType.Date },
  { name: 'country', type: ColumnType.String },
  { name: 'firstName', type: ColumnType.String },
  { name: 'lastName', type: ColumnType.String },
];
export const brandAndCommsEventsColumns: ReportColumn<keyof BrandAndCommsEventResult>[] = [
  { name: 'email', type: ColumnType.String },
  { name: 'startedDate', type: ColumnType.Date },
  { name: 'completedDate', type: ColumnType.Date },
  { name: 'emailVerifedDate', type: ColumnType.Date },
  { name: 'passwordCreatedDate', type: ColumnType.Date },
];
export const loginReportColumns: ReportColumn<keyof LoginReportResult>[] = [
  { name: 'date', type: ColumnType.Date },
  { name: 'identity', type: ColumnType.String },
  { name: 'status', type: ColumnType.String },
];
export const guidedDiscussionColumns: ReportColumn<keyof GuideDiscussionResult>[] = [
  { name: 'explorerName', type: ColumnType.String },
  { name: 'explorerEmail', type: ColumnType.String },
  { name: 'cancelledGdDate', type: ColumnType.Date },
  { name: 'completedGdDate', type: ColumnType.Date },
  { name: 'gdBundlePurchaseDate', type: ColumnType.Date },
  { name: 'gdBundleDiscount', type: ColumnType.String },
  { name: 'gdBundlePurchasePrice', type: ColumnType.String },
  { name: 'gdDiscount', type: ColumnType.String },
  { name: 'gdPurchaseDate', type: ColumnType.Date },
  { name: 'gdPurchasePrice', type: ColumnType.String },
  { name: 'gdStatus', type: ColumnType.String },
  { name: 'guideName', type: ColumnType.String },
  { name: 'guideEmail', type: ColumnType.String },
  { name: 'mwiDiscount', type: ColumnType.String },
  { name: 'mwiPurchaseDate', type: ColumnType.Date },
  { name: 'mwiPurchasePrice', type: ColumnType.String },
  { name: 'preWorkSubmittedDate', type: ColumnType.Date },
  { name: 'scheduledGdDate', type: ColumnType.Date },
];
export const responseReportColumns: ReportColumn<keyof ResponseReportResult>[] = [
  { name: 'question', type: ColumnType.String },
  { name: 'neverHardlyEver', type: ColumnType.String },
  { name: 'seldom', type: ColumnType.String },
  { name: 'sometimes', type: ColumnType.String },
  { name: 'often', type: ColumnType.String },
  { name: 'alwaysAlmostAlways', type: ColumnType.String },
  { name: 'timesChosenAsFocusArea', type: ColumnType.String },
];
export const momitReportColumns: ReportColumn<keyof MomitReportResult>[] = [
  { name: 'date', type: ColumnType.Date },
  { name: 'pid', type: ColumnType.String },
];
export const freePromoReportColumns: ReportColumn<keyof FreePromoReportResult>[] = [
  { name: 'firstName', type: ColumnType.String },
  { name: 'lastName', type: ColumnType.String },
  { name: 'email', type: ColumnType.String },
  { name: 'usedDate', type: ColumnType.Date },
  { name: 'packageName', type: ColumnType.String },
  { name: 'isSphereist', type: ColumnType.String },
];
export const promoReportColumns: ReportColumn<keyof PromoReportResult>[] = [
  { name: 'firstName', type: ColumnType.String },
  { name: 'lastName', type: ColumnType.String },
  { name: 'email', type: ColumnType.String },
  { name: 'promoCode', type: ColumnType.String },
  { name: 'payedAmount', type: ColumnType.String },
  { name: 'usedDate', type: ColumnType.Date },
  { name: 'packageName', type: ColumnType.String },
];
export const mirrorReflectionReportColumns: ReportColumn<keyof MirrorReflectionResult>[] = [
  { name: 'email', type: ColumnType.String },
  { name: 'firstName', type: ColumnType.String },
  { name: 'lastName', type: ColumnType.String },
  { name: 'startedDate', type: ColumnType.Date },
  { name: 'completedDate', type: ColumnType.Date },
  { name: 'prompt_1_answered_date', type: ColumnType.Date },
  { name: 'prompt_2_answered_date', type: ColumnType.Date },
  { name: 'prompt_3_answered_date', type: ColumnType.Date },
  { name: 'prompt_4_answered_date', type: ColumnType.Date },
  { name: 'prompt_5_answered_date', type: ColumnType.Date },
  { name: 'prompt_6_answered_date', type: ColumnType.Date },
  { name: 'prompt_7_answered_date', type: ColumnType.Date },
  { name: 'prompt_8_answered_date', type: ColumnType.Date },
];
export const countyFunnelReportColumns: ReportColumn<keyof CountFunnelReportResult>[] = [
  { name: 'date', type: ColumnType.String },
  { name: 'started_mwi', type: ColumnType.String },
  { name: 'completed_mwi', type: ColumnType.String },
  { name: 'mwi_report_only_purchase', type: ColumnType.String },
  { name: 'bundle_purchase', type: ColumnType.String },
];
export const wlfReportColumns: ReportColumn<keyof WorkLifeReportResult>[] = [
  { name: 'email', type: ColumnType.String },
  { name: 'startedDate', type: ColumnType.Date },
  { name: 'accountCreatedDate', type: ColumnType.Date },
  { name: 'assessmentCompletionDate', type: ColumnType.Date },
  { name: 'warmUpCompletedDate', type: ColumnType.Date },
  { name: 'strengthenCompletedDate', type: ColumnType.Date },
  { name: 'trainingCompletedDate', type: ColumnType.Date },
  { name: 'pdfDownloadedDate', type: ColumnType.Date },
];
export const wlfBuilderReportColumns: ReportColumn<keyof WlfBuilderReportResult>[] = [
  { name: 'email', type: ColumnType.String },
  { name: 'purchaseDate', type: ColumnType.Date },
  { name: 'promoCode', type: ColumnType.String },
  { name: 'inventoryCompletedDate', type: ColumnType.Date },
  { name: 'initialReflectionCompletedDate', type: ColumnType.Date },
  { name: 'deeperExplorationCompletedDate', type: ColumnType.Date },
  { name: 'pathForwardCompletedDate', type: ColumnType.Date },
];
export const wlfAnonymousColumns: ReportColumn<keyof WLFAnonymousResult>[] = [
  { name: 'worklifeArea', type: ColumnType.String },
  { name: 'e1', type: ColumnType.String },
  { name: 'e2', type: ColumnType.String },
  { name: 'e3', type: ColumnType.String },
  { name: 'e4', type: ColumnType.String },
  { name: 'e5', type: ColumnType.String },
  { name: 'i1', type: ColumnType.String },
  { name: 'i2', type: ColumnType.String },
  { name: 'i3', type: ColumnType.String },
  { name: 'i4', type: ColumnType.String },
  { name: 'i5', type: ColumnType.String },
  { name: 'aligned', type: ColumnType.String },
  { name: 'growthOpportunities', type: ColumnType.String },
  { name: 'hiddenStrengths', type: ColumnType.String },
];
export enum MirrorReflectionSubEvents {
  Started = 'started',
  QuestionAnswered = 'questionAnswered',
  Completed = 'completed',
  Deleted = 'deleted',
}

export const ReportTypesArray: string[] = Object.values(ReportType);
