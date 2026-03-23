import config from '../../config';
import * as AWSReports from '../aws/reports';
import { FilterByColumns, LoginStatus } from '../constants';
import { ReportData } from '../entities/report-data';
import { toUtcRangeFlexible } from '../utils/date-utils';

export interface BrandAndCommsResult {
  email?: string;
  pid?: string;
  username?: string;
  marketingOptin?: boolean;
  uid?: string;
  taxamoPurchaseDate?: string | number;
  completedDate?: string | number;
  taxamoCountry?: string;
  userRegistrationDate?: string | number;
  country?: string;
  firstName?: string;
  lastName?: string;
}
export interface DemograchicResult {
  userId?: string;
  submissionDate?: string | number;
  ageGroup?: number;
  highestEducationLevel?: number;
  gender?: number;
  regionOfBirth?: number;
  regionWhereYouLive?: number;
  industry?: number;
  occupation?: number;
  responsesToSurvey?: string;
}
export interface LoginReportResult {
  identity: string;
  status: string;
  date: string | number;
}
export interface ReportFilter {
  startOfDate: string;
  endOfDate: string;
  filterBy: FilterByColumns;
}
export interface MomitReportResult {
  pid: string;
  date: string | number;
  email?: string;
  username?: string;
}
export interface PromoReportResult {
  firstName: string;
  lastName: string;
  email: string;
  usedDate: string | number;
  payedAmount: number;
  promoCode: string;
  packageName: string;
}
export interface FreePromoReportResult extends PromoReportResult {
  isSphereist: boolean;
}
export interface BrandAndCommsEventResult {
  email: string;
  startedDate: string | number;
  completedDate: string | number;
  emailVerifedDate: string | number;
  passwordCreatedDate: string | number;
}
export interface GuideDiscussionResult {
  explorerName: string;
  explorerEmail: string | number;
  mwiPurchaseDate: string | number;
  mwiPurchasePrice: number;
  mwiDiscount: number | string;
  preWorkSubmittedDate: string | number;
  gdPurchaseDate: string | number;
  gdPurchasePrice: number;
  gdDiscount: number | string;
  gdBundlePurchaseDate: string | number;
  gdBundlePurchasePrice: number;
  gdBundleDiscount: number | string;
  cancelledGdDate: string | number;
  completedGdDate: string | number;
  scheduledGdDate: string | number;
  guideName: string;
  guideEmail: string | number;
  gdStatus: string;
}
export interface ResponseReportResult {
  question: string;
  neverHardlyEver: number;
  seldom: number;
  sometimes: number;
  often: number;
  alwaysAlmostAlways: number;
  timesChosenAsFocusArea: number;
}
export interface MirrorReflectionResult {
  email: string;
  firstName: string;
  lastName: string;
  startedDate: string | number;
  completedDate: string | number;
  prompt_1_answered_date: string | number;
  prompt_2_answered_date: string | number;
  prompt_3_answered_date: string | number;
  prompt_4_answered_date: string | number;
  prompt_5_answered_date: string | number;
  prompt_6_answered_date: string | number;
  prompt_7_answered_date: string | number;
  prompt_8_answered_date: string | number;
}
export interface CountFunnelReportResult {
  date: string;
  started_mwi: number;
  completed_mwi: number;
  mwi_report_only_purchase: number;
  bundle_purchase: number;
}
export interface WorkLifeReportResult {
  email: string;
  startedDate: string | number;
  accountCreatedDate: string | number;
  assessmentCompletionDate: string | number;
  warmUpCompletedDate: string | number;
  strengthenCompletedDate: string | number;
  trainingCompletedDate: string | number;
  pdfDownloadedDate: string | number;
}
export interface WlfBuilderReportResult {
  email: string;
  purchaseDate: string | number;
  promoCode: string;
  inventoryCompletedDate: string | number;
  initialReflectionCompletedDate: string | number;
  deeperExplorationCompletedDate: string | number;
  pathForwardCompletedDate: string | number;
  registrationSource: string;
}
export interface WLFAnonymousResult {
  worklifeArea: string;
  e1: string | number;
  e2: string | number;
  e3: string | number;
  e4: string | number;
  e5: string | number;
  i1: string | number;
  i2: string | number;
  i3: string | number;
  i4: string | number;
  i5: string | number;
  aligned: string | number;
  hiddenStrengths: string | number;
  growthOpportunities: string | number;
}
export type ReportFilterData = {
  startOfDate: string;
  endOfDate: string;
};
export type ReportUtcFinderRange = { startUtc: number; endUtc: number };
export interface LoginDataReportFilerData extends ReportFilterData {
  status?: LoginStatus;
}
export enum BundleType {
  Survey = 'survey',
  GuidedDiscussion = 'guidedDiscussion',
  Both = 'both',
}

export async function brandAndComms(startOfDate: string, endOfDate: string): Promise<BrandAndCommsResult[]> {
  const rangeDate: ReportUtcFinderRange = toUtcRangeFlexible(startOfDate, endOfDate, config.intranetReportTimezon);
  switch (config.deploymenEnv) {
    case 'aws':
      return AWSReports.brandAndComms(config.awsConfig!, rangeDate.startUtc, rangeDate.endUtc);
    case 'azure':
      throw Error('Not implemented yet.');
  }
}
export async function candbEvents(startOfDate: string, endOfDate: string): Promise<BrandAndCommsEventResult[]> {
  const rangeDate: ReportUtcFinderRange = toUtcRangeFlexible(startOfDate, endOfDate, config.intranetReportTimezon);
  switch (config.deploymenEnv) {
    case 'aws':
      return AWSReports.brandAndCommsEvents(config.awsConfig!, rangeDate.startUtc, rangeDate.endUtc);
    case 'azure':
      throw Error('Not implemented yet.');
  }
}
export async function guidedDiscussion(
  startOfDate: string,
  endOfDate: string,
  filterBy: FilterByColumns,
): Promise<GuideDiscussionResult[]> {
  const rangeDate: ReportUtcFinderRange = toUtcRangeFlexible(startOfDate, endOfDate, config.intranetReportTimezon);
  switch (config.deploymenEnv) {
    case 'aws':
      return AWSReports.guidedDiscussionEvents(config.awsConfig!, rangeDate.startUtc, rangeDate.endUtc, filterBy);
    case 'azure':
      throw Error('Not implemented yet.');
  }
}
export async function demographicReport(startOfDate: string, endOfDate: string): Promise<DemograchicResult[]> {
  const rangeDate: ReportUtcFinderRange = toUtcRangeFlexible(startOfDate, endOfDate, config.intranetReportTimezon);
  switch (config.deploymenEnv) {
    case 'aws':
      return AWSReports.demograchic(config.awsConfig!, rangeDate.startUtc, rangeDate.endUtc);
    case 'azure':
      throw Error('Not implemented yet.');
  }
}
export async function loginReport(data: LoginDataReportFilerData): Promise<LoginReportResult[]> {
  const rangeDate: ReportUtcFinderRange = toUtcRangeFlexible(
    data.startOfDate,
    data.endOfDate,
    config.intranetReportTimezon,
  );
  switch (config.deploymenEnv) {
    case 'aws':
      return AWSReports.loginReport(config.awsConfig!, {
        startOfDate: rangeDate.startUtc,
        endOfDate: rangeDate.endUtc,
        status: data.status,
      });
    case 'azure':
      throw Error('Not implemented yet.');
  }
}
export async function momit(startOfDate: string, endOfDate: string): Promise<MomitReportResult[]> {
  const rangeDate: ReportUtcFinderRange = toUtcRangeFlexible(startOfDate, endOfDate, config.intranetReportTimezon);
  switch (config.deploymenEnv) {
    case 'aws':
      return AWSReports.momitData(config.awsConfig!, rangeDate.startUtc, rangeDate.endUtc);
    case 'azure':
      throw Error('Not implemented yet.');
  }
}
export async function promo(startOfDate: string, endOfDate: string): Promise<PromoReportResult[]> {
  const rangeDate: ReportUtcFinderRange = toUtcRangeFlexible(startOfDate, endOfDate, config.intranetReportTimezon);
  switch (config.deploymenEnv) {
    case 'aws':
      return AWSReports.promo(config.awsConfig!, rangeDate.startUtc, rangeDate.endUtc);
    case 'azure':
      throw Error('Not implemented yet.');
  }
}
export async function freePromo(startOfDate: string, endOfDate: string): Promise<FreePromoReportResult[]> {
  const rangeDate: ReportUtcFinderRange = toUtcRangeFlexible(startOfDate, endOfDate, config.intranetReportTimezon);
  switch (config.deploymenEnv) {
    case 'aws':
      return AWSReports.freePromo(config.awsConfig!, rangeDate.startUtc, rangeDate.endUtc);
    case 'azure':
      throw Error('Not implemented yet.');
  }
}
export async function responseReport(startOfDate: string, endOfDate: string): Promise<ResponseReportResult[]> {
  const rangeDate: ReportUtcFinderRange = toUtcRangeFlexible(startOfDate, endOfDate, config.intranetReportTimezon);
  switch (config.deploymenEnv) {
    case 'aws':
      return AWSReports.responseReport(rangeDate.startUtc, rangeDate.endUtc);
    case 'azure':
      throw Error('Not implemented yet.');
  }
}
export async function countFunnelReport(startOfDate: string, endOfDate: string): Promise<CountFunnelReportResult[]> {
  const rangeDate: ReportUtcFinderRange = toUtcRangeFlexible(startOfDate, endOfDate, config.intranetReportTimezon);
  switch (config.deploymenEnv) {
    case 'aws':
      return AWSReports.countFunnelReprot(config.awsConfig!, rangeDate.startUtc, rangeDate.endUtc);
    case 'azure':
      throw Error('Not implemented yet.');
  }
}
export async function wlfReport(reportData: ReportData, reportFilter: ReportFilter): Promise<void> {
  const rangeDate: ReportUtcFinderRange = toUtcRangeFlexible(
    reportFilter.startOfDate,
    reportFilter.endOfDate,
    config.intranetReportTimezon,
  );
  switch (config.deploymenEnv) {
    case 'aws':
      await AWSReports.worklifeFulfillment(
        config.awsConfig!,
        rangeDate.startUtc,
        rangeDate.endUtc,
        reportFilter.filterBy,
        reportData,
      );
      break;
    case 'azure':
      throw Error('Not implemented yet.');
  }
}
export async function wlfBuilderReport(
  startOfDate: string,
  endOfDate: string,
  filterBy: FilterByColumns,
): Promise<WlfBuilderReportResult[]> {
  const rangeDate: ReportUtcFinderRange = toUtcRangeFlexible(startOfDate, endOfDate, config.intranetReportTimezon);
  switch (config.deploymenEnv) {
    case 'aws':
      return AWSReports.wlfBuilder(config.awsConfig!, rangeDate.startUtc, rangeDate.endUtc, filterBy);
    case 'azure':
      throw Error('Not implemented yet.');
  }
}

export async function wlfAnonymousReport(startOfDate: string, endOfDate: string): Promise<WLFAnonymousResult[]> {
  const rangeDate: ReportUtcFinderRange = toUtcRangeFlexible(startOfDate, endOfDate, config.intranetReportTimezon);
  switch (config.deploymenEnv) {
    case 'aws':
      return AWSReports.wlfAnonymous(config.awsConfig!, rangeDate.startUtc, rangeDate.endUtc);
    case 'azure':
      throw Error('Not implemented yet.');
  }
}
export async function mirrorReflectionReport(
  startOfDate: string,
  endOfDate: string,
  filterBy: FilterByColumns,
): Promise<MirrorReflectionResult[]> {
  const rangeDate: ReportUtcFinderRange = toUtcRangeFlexible(startOfDate, endOfDate, config.intranetReportTimezon);
  switch (config.deploymenEnv) {
    case 'aws':
      return AWSReports.mirrorReflection(config.awsConfig!, rangeDate.startUtc, rangeDate.endUtc, filterBy);
    case 'azure':
      throw Error('Not implemented yet.');
  }
}
