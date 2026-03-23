import { IConfig } from './config';
import * as AWSEventTracking from './dynamodb/event-tracking';
import { SurveyAnswer, findAllForResponsReport, findAll, findAllAnswersByPersonId } from '../entities/survey-answer';
import * as AWSPerson from './dynamodb/person';
import { Person } from '../entities/person';
import * as AWSUserProfile from './dynamodb/user-profile';
import { UserProfile } from '../entities/user-profile';
import {
  BrandAndCommsResult,
  LoginReportResult,
  DemograchicResult,
  BrandAndCommsEventResult,
  MomitReportResult,
  GuideDiscussionResult,
  BundleType,
  ResponseReportResult,
  PromoReportResult,
  MirrorReflectionResult,
  FreePromoReportResult,
  CountFunnelReportResult,
  WorkLifeReportResult,
  WlfBuilderReportResult,
  WLFAnonymousResult,
} from '../controllers/reports';
import { SurveyDemographicData } from '../entities/demographic-data';
import * as AWSDemographicData from './dynamodb/demographic-data';
import { measureTypes, processAnswers, reverseMeasureTypes } from '../processor';
import {
  BrandAndCommsEvents,
  GuidedReportCompletionStatus,
  MirrorReflectionSubEvents,
  WlfBuilderEvents,
  WlfEvents,
  ageGap,
  eduaction,
  gender,
  industry,
  occupation,
  region,
} from '../report/constants';
import { LoginData } from '../entities/login-data';
import * as AWSLoginData from './dynamodb/login-data';
import { Payment, findPaymentByAnswerId } from '../entities/payment';
import { FilterByColumns, LoginStatus, ProgressStatus, SurveyAnswerProcessStatus } from '../constants';
import { EventTracking, EventType, GuidedDiscussionEvents } from '../entities/event-tracking';
import { formatEpochToDayMon, timestampToDateForReport } from '../utils/date-utils';
import { MWIQuestions } from '../report/response-report-questions';
import { GuidedDiscussion, findAllDiscussionsForResponseReport } from '../entities/guided-discussion';
import { getWorkbooksByDate, WlfBuilderWorkbook } from '../entities/wlf-builder/workbook';
import { Effect } from 'effect';
import { findAllByDateRange } from './dynamodb/wlf-indicator/answer';
import { IndicatorAnswer } from '../entities/wlf-indicator/answer';
import { IndicatorController } from '../controllers/wlf-indicator';
import { ReportData, updateReportData } from '../entities/report-data';
import { publishMessage } from '../publish-message';
import { respond } from '../request';

export async function brandAndComms(
  config: IConfig,
  startOfDate: number,
  endOfDate: number,
): Promise<BrandAndCommsResult[]> {
  const surveyAnswers: SurveyAnswer[] = await findAll(startOfDate, endOfDate);
  const reportData: BrandAndCommsResult[] = [];
  for (const surveyAnswer of surveyAnswers) {
    if (surveyAnswer.status == null || surveyAnswer.status === SurveyAnswerProcessStatus.Done) {
      const reportItem: BrandAndCommsResult = {
        pid: surveyAnswer.personId,
        taxamoPurchaseDate: surveyAnswer.purchaseDate,
        completedDate: surveyAnswer.completedAt,
      };
      const paymentInfo: Payment | undefined = await findPaymentByAnswerId(surveyAnswer.id!);
      if (surveyAnswer.personId != null) {
        const person: Person | undefined = await AWSPerson.findById(config, surveyAnswer.personId);
        if (person?.id != null) {
          reportItem.firstName = person.firstName ?? '';
          reportItem.lastName = person.lastName ?? '';

          const users: UserProfile[] = await AWSUserProfile.findAllByPid(config, person.id);
          if (users.length > 0) {
            const user: UserProfile = users[0];
            reportItem.email = user.email ?? '';
            reportItem.marketingOptin = user.marketing ?? false;
            reportItem.taxamoCountry = paymentInfo?.taxCCode ?? 'US';
            reportItem.country = user.country ?? 'USA';
            reportItem.uid = user.id ?? '';
            reportItem.userRegistrationDate = user.createdAt;
            reportItem.username = user.username ?? '';
          }
        }
      }
      reportData.push(reportItem);
    }
  }

  return reportData;
}
export async function demograchic(
  config: IConfig,
  startOfDate: number,
  endOfDate: number,
): Promise<DemograchicResult[]> {
  const demographicDataList: SurveyDemographicData[] = await AWSDemographicData.findAllForReport(
    config,
    startOfDate,
    endOfDate,
  );
  const reportData: DemograchicResult[] = [];

  for (const data of demographicDataList) {
    let surveyAnswers: { answers: string; id: string } = { answers: '', id: '' };
    if (data.personId != null) {
      surveyAnswers = await getSurveyAnswersString(data.personId);
    } else if (data.createdBy != null) {
      surveyAnswers = await getSurveyAnswersString(data.createdBy);
    }
    const item: DemograchicResult = {
      submissionDate: new Date(data.createdAt!).toString(),
      userId: surveyAnswers.id,
      gender: data.gender == null ? 0 : gender[data.gender],
      ageGroup: data.age == null ? 0 : ageGap[data.age],
      highestEducationLevel: data.education == null ? 0 : eduaction[data.education],
      regionOfBirth: data.birthRegion == null ? 0 : region[data.birthRegion],
      regionWhereYouLive: data.liveRegion == null ? 0 : region[data.liveRegion],
      industry: data.industry == null ? 0 : industry[data.industry],
      occupation: data.occupation == null ? 0 : occupation[data.occupation],
    };
    if (surveyAnswers != null) {
      item.responsesToSurvey = `"${surveyAnswers.answers}"`;
    }
    reportData.push(item);
    await updateDemographicData(config, data);
  }

  return reportData;
}
async function getSurveyAnswersString(personId: string): Promise<{ answers: string; id: string }> {
  const surveyAnswer: SurveyAnswer[] = await findAllAnswersByPersonId(personId);

  if (surveyAnswer.length === 0 || surveyAnswer[0].answers == null) {
    return { answers: '', id: '' };
  }

  const answers = JSON.parse(surveyAnswer[0].answers);
  const jsonKeys: string[] = Object.keys(answers);
  const answersString = jsonKeys
    .map((key: string, index: number) => {
      if (index >= 14 && index <= 16) {
        return processAnswers(answers[key], reverseMeasureTypes);
      }
      return processAnswers(answers[key], measureTypes);
    })
    .join(',');
  return { answers: answersString, id: surveyAnswer[0].id! };
}
async function updateDemographicData(config: IConfig, data: SurveyDemographicData) {
  data.reported = 'yes';
  await AWSDemographicData.updateReported(config, data);
}
export async function loginReport(
  config: IConfig,
  data: { startOfDate: number; endOfDate: number; status?: LoginStatus },
): Promise<LoginReportResult[]> {
  return (await AWSLoginData.findAllByStatus(config, data)).map((data: LoginData) => {
    return {
      identity: data.identity,
      status: data.status,
      date: data.createdAt,
    } as LoginReportResult;
  });
}
export async function brandAndCommsEvents(
  config: IConfig,
  startOfDate: number,
  endOfDate: number,
): Promise<BrandAndCommsEventResult[]> {
  const events: EventTracking[] = await AWSEventTracking.findAllOfType(
    config,
    startOfDate,
    endOfDate,
    EventType.BrandAndCommsEvent,
  );
  const reportData: Record<string, BrandAndCommsEventResult> = {};

  events.forEach((item: EventTracking) => {
    if (reportData[item.email] == null) {
      reportData[item.email] = {
        email: item.email,
        startedDate: '',
        completedDate: '',
        emailVerifedDate: '',
        passwordCreatedDate: '',
      } as BrandAndCommsEventResult;
    }
    switch (item.event) {
      case BrandAndCommsEvents.Completed:
        reportData[item.email].completedDate = item.createdAt || '';
        break;
      case BrandAndCommsEvents.Started:
        reportData[item.email].startedDate = item.createdAt || '';
        break;
      case BrandAndCommsEvents.EmailVerified:
        reportData[item.email].emailVerifedDate = item.createdAt || '';
        break;
      case BrandAndCommsEvents.PasswordCreated:
        reportData[item.email].passwordCreatedDate = item.createdAt || '';
        break;
    }
  });

  return Object.values(reportData).filter(
    (item) =>
      item.completedDate != '' ||
      item.startedDate != '' ||
      item.emailVerifedDate != '' ||
      item.passwordCreatedDate != '',
  );
}
export async function momitData(config: IConfig, startOfDate: number, endOfDate: number): Promise<MomitReportResult[]> {
  return (await AWSEventTracking.findAllOfType(config, startOfDate, endOfDate, EventType.MomitEvent)).map(
    (data: EventTracking) => {
      return {
        pid: data.id,
        date: data.createdAt,
        email: data.email,
        username: data.username,
      } as MomitReportResult;
    },
  );
}
export async function promo(config: IConfig, startOfDate: number, endOfDate: number): Promise<PromoReportResult[]> {
  return (await AWSEventTracking.findAllOfType(config, startOfDate, endOfDate, EventType.PromoCodeUsageEvent)).map(
    (data: EventTracking) => {
      return {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        promoCode: data.promoCode,
        payedAmount: data.payedAmount,
        packageName: data.packageName,
        usedDate: data.createdAt,
      } as PromoReportResult;
    },
  );
}
export async function freePromo(
  config: IConfig,
  startOfDate: number,
  endOfDate: number,
): Promise<FreePromoReportResult[]> {
  const substrings = ['meaningsphere.com', 'meaningsphere.guide'];
  return (await AWSEventTracking.findAllOfType(config, startOfDate, endOfDate, EventType.PromoCodeUsageEvent))
    .filter((item) => item.payedAmount == 0)
    .map((data: EventTracking) => {
      return {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        usedDate: data.createdAt,
        packageName: data.packageName,
        isSphereist: substrings.some((sub) => data.email.includes(sub)),
      } as FreePromoReportResult;
    });
}
export async function wlfAnonymous(
  config: IConfig,
  startOfDate: number,
  endOfDate: number,
): Promise<WLFAnonymousResult[]> {
  const wlfAnswers: IndicatorAnswer[] = await Effect.runPromise(
    await findAllByDateRange(config, startOfDate, endOfDate),
  );
  const reportData: Record<string, WLFAnonymousResult> = {};

  const keyList: string[] = [
    'inspiration',
    'growth',
    'impact',
    'connection',
    'energy',
    'engagement',
    'flexibility',
    'harmony',
    'appreciation',
    'autonomy',
  ];
  for (const key of keyList) {
    reportData[key] = createEmptyWlfAnonymousReportObject(key);
  }

  for (const answer of wlfAnswers) {
    if (answer.answers != null && answer.status == SurveyAnswerProcessStatus.Done) {
      const answersArray = JSON.parse(answer.answers);
      for (const key of keyList) {
        const ansExpValue: number = answersArray[`${key}-exp`];
        const ansImpValue: number = answersArray[`${key}-imp`];
        if (ansExpValue !== undefined && ansImpValue !== undefined) {
          (reportData[key][`e${ansExpValue}` as keyof WLFAnonymousResult] as number)++;
          (reportData[key][`i${ansImpValue}` as keyof WLFAnonymousResult] as number)++;
        }
        const area: IndicatorController.Area = { exp: ansExpValue, imp: ansImpValue };
        if (IndicatorController.isAligned(area)) (reportData[key].aligned as number)++;
        if (IndicatorController.isGrowthOpportunity(area)) (reportData[key].growthOpportunities as number)++;
        if (IndicatorController.isHiddenStrength(area)) (reportData[key].hiddenStrengths as number)++;
      }
    }
  }

  return Object.values(reportData);
}
export async function mirrorReflection(
  config: IConfig,
  startOfDate: number,
  endOfDate: number,
  filterBy: FilterByColumns,
): Promise<MirrorReflectionResult[]> {
  const events: EventTracking[] = await AWSEventTracking.findAllOfType(
    config,
    startOfDate,
    endOfDate,
    EventType.MirrorReflectionEvent,
  );
  let filteredEvents: string[] = [];
  if (filterBy == FilterByColumns.CompletedAt) {
    filteredEvents = Array.from(
      new Set(events.filter((item) => item.mrEvent === MirrorReflectionSubEvents.Completed).map((item) => item.mrId!)),
    );
  } else {
    filteredEvents = Array.from(
      new Set(events.filter((item) => item.mrEvent === MirrorReflectionSubEvents.Started).map((item) => item.mrId!)),
    );
  }

  const reportData: Record<string, MirrorReflectionResult> = {};
  for (const key of filteredEvents) {
    const mirrorEvents: EventTracking[] = await AWSEventTracking.findAllByCustomKey(
      config,
      key,
      EventType.MirrorReflectionEvent,
    );
    reportData[key] = createEmptyMRReportObject();
    for (const mirrorEvent of mirrorEvents) {
      if (mirrorEvent.mrEvent === MirrorReflectionSubEvents.Started) {
        reportData[key].startedDate = mirrorEvent.createdAt || 0;
        reportData[key].email = mirrorEvent.email || '';
        reportData[key].firstName = mirrorEvent.firstName || '';
        reportData[key].lastName = mirrorEvent.lastName || '';
      } else if (mirrorEvent.mrEvent === MirrorReflectionSubEvents.QuestionAnswered) {
        if (mirrorEvent.qNumber === 'mr-1') {
          reportData[key].prompt_1_answered_date = mirrorEvent.createdAt || 0;
        } else if (mirrorEvent.qNumber === 'mr-2') {
          reportData[key].prompt_2_answered_date = mirrorEvent.createdAt || 0;
        } else if (mirrorEvent.qNumber === 'mr-3') {
          reportData[key].prompt_3_answered_date = mirrorEvent.createdAt || 0;
        } else if (mirrorEvent.qNumber === 'mr-4') {
          reportData[key].prompt_4_answered_date = mirrorEvent.createdAt || 0;
        } else if (mirrorEvent.qNumber === 'mr-5') {
          reportData[key].prompt_5_answered_date = mirrorEvent.createdAt || 0;
        } else if (mirrorEvent.qNumber === 'mr-6') {
          reportData[key].prompt_6_answered_date = mirrorEvent.createdAt || 0;
        } else if (mirrorEvent.qNumber === 'mr-7') {
          reportData[key].prompt_7_answered_date = mirrorEvent.createdAt || 0;
        } else if (mirrorEvent.qNumber === 'mr-8') {
          reportData[key].prompt_8_answered_date = mirrorEvent.createdAt || 0;
        }
      } else if (mirrorEvent.mrEvent === MirrorReflectionSubEvents.Completed) {
        reportData[key].completedDate = mirrorEvent.createdAt || 0;
      }
    }
  }
  return Object.values(reportData);
}
export async function worklifeFulfillment(
  config: IConfig,
  startOfDate: number,
  endOfDate: number,
  filterBy: FilterByColumns,
  reportData: ReportData,
): Promise<void> {
  const events: EventTracking[] = await AWSEventTracking.findAllOfType(
    config,
    startOfDate,
    endOfDate,
    EventType.WlfIndicatorEvent,
  );
  let filteredEvents: string[] = [];
  if (filterBy == FilterByColumns.CompletedAt) {
    filteredEvents = Array.from(
      new Set(events.filter((item) => item.event === WlfEvents.Completed).map((item) => item.personId!)),
    );
  } else if (filterBy == FilterByColumns.StartedAt) {
    filteredEvents = Array.from(
      new Set(events.filter((item) => item.event === WlfEvents.Started).map((item) => item.personId!)),
    );
  } else if (filterBy == FilterByColumns.CreatedAt) {
    filteredEvents = Array.from(
      new Set(events.filter((item) => item.event === WlfEvents.EmailVerified).map((item) => item.personId!)),
    );
  } else if (filterBy == FilterByColumns.FirstSectionCompletedAt) {
    filteredEvents = Array.from(
      new Set(events.filter((item) => item.event === WlfEvents.WarmUpCompleted).map((item) => item.personId!)),
    );
  } else if (filterBy == FilterByColumns.SecondSectionCompletedAt) {
    filteredEvents = Array.from(
      new Set(events.filter((item) => item.event === WlfEvents.TargetAreaCompleted).map((item) => item.personId!)),
    );
  } else {
    filteredEvents = Array.from(
      new Set(events.filter((item) => item.event === WlfEvents.TrainingPlanCompleted).map((item) => item.personId!)),
    );
  }

  reportData.status = ProgressStatus.Processing;
  reportData.idsToProcess = filteredEvents;
  reportData.result = JSON.stringify({});
  await updateReportData(reportData, ['status', 'result', 'idsToProcess']);
  for (const key of filteredEvents) {
    await publishMessage(
      'report-item-calculation',
      respond({ reportData: { id: reportData.id! }, itemId: key }, { pid: reportData.createdBy! }),
    );
  }
}
export async function wlfBuilder(
  config: IConfig,
  startOfDate: number,
  endOfDate: number,
  filterBy: FilterByColumns,
): Promise<WlfBuilderReportResult[]> {
  const events: EventTracking[] = await AWSEventTracking.findAllOfType(
    config,
    startOfDate,
    endOfDate,
    EventType.WlfBuilderEvent,
  );
  let filteredEvents: string[] = [];
  if (filterBy == FilterByColumns.CompletedAt) {
    filteredEvents = Array.from(
      new Set(events.filter((item) => item.event === WlfBuilderEvents.Completed).map((item) => item.personId!)),
    );
  } else if (filterBy == FilterByColumns.PurchasedAt) {
    filteredEvents = Array.from(
      new Set(events.filter((item) => item.event === WlfBuilderEvents.PurchaseDate).map((item) => item.personId!)),
    );
  } else if (filterBy == FilterByColumns.FirstSectionCompletedAt) {
    filteredEvents = Array.from(
      new Set(events.filter((item) => item.event === WlfBuilderEvents.FirstModule).map((item) => item.personId!)),
    );
  } else if (filterBy == FilterByColumns.SecondSectionCompletedAt) {
    filteredEvents = Array.from(
      new Set(
        events.filter((item) => item.event === WlfBuilderEvents.SecondModuleCompleted).map((item) => item.personId!),
      ),
    );
  } else if (filterBy == FilterByColumns.ThirdSectionCompletedAt) {
    filteredEvents = Array.from(
      new Set(
        events.filter((item) => item.event === WlfBuilderEvents.ThirdModuleCompleted).map((item) => item.personId!),
      ),
    );
  }

  const reportData: Record<string, WlfBuilderReportResult> = {};
  for (const key of filteredEvents) {
    const wlfEvents: EventTracking[] = await AWSEventTracking.findAllByCustomKeyStartsWith(
      config,
      key,
      EventType.WlfBuilderEvent,
    );
    reportData[key] = createEmptyBuilderReportObject();
    for (const wlfEvent of wlfEvents) {
      if (wlfEvent.event === WlfBuilderEvents.PurchaseDate) {
        reportData[key].purchaseDate = wlfEvent.createdAt ?? 0;
        reportData[key].promoCode = wlfEvent.promoCode ?? '';
      } else if (wlfEvent.event === WlfBuilderEvents.Completed) {
        reportData[key].inventoryCompletedDate = wlfEvent.createdAt ?? 0;
      } else if (wlfEvent.event === WlfBuilderEvents.FirstModule) {
        reportData[key].initialReflectionCompletedDate = wlfEvent.createdAt ?? 0;
      } else if (wlfEvent.event === WlfBuilderEvents.SecondModuleCompleted) {
        reportData[key].deeperExplorationCompletedDate = wlfEvent.createdAt ?? 0;
      } else if (wlfEvent.event === WlfBuilderEvents.ThirdModuleCompleted) {
        reportData[key].pathForwardCompletedDate = wlfEvent.createdAt ?? 0;
      } else if (wlfEvent.event === WlfBuilderEvents.RegistrationSource) {
        reportData[key].registrationSource = wlfEvent['registrationSource'];
      }

      if (reportData[key].email === '') reportData[key].email = wlfEvent.email ?? '';
    }
  }
  return Object.values(reportData);
}
export async function guidedDiscussionEvents(
  config: IConfig,
  startOfDate: number,
  endOfDate: number,
  filterBy: FilterByColumns,
): Promise<GuideDiscussionResult[]> {
  const events: EventTracking[] = await AWSEventTracking.findAllOfType(
    config,
    startOfDate,
    endOfDate,
    EventType.GuidedDiscussionEvent,
  );
  let filteredEvents: string[] = [];
  if (filterBy == FilterByColumns.CompletedAt) {
    filteredEvents = Array.from(
      new Set(
        events
          .filter(
            (item) =>
              item.event === GuidedDiscussionEvents.CompletionStatus &&
              item.status === GuidedReportCompletionStatus.Complete,
          )
          .map((item) => item.discussionId!),
      ),
    );
  } else {
    filteredEvents = Array.from(
      new Set(
        events.filter((item) => item.event === GuidedDiscussionEvents.PackageInfo).map((item) => item.discussionId!),
      ),
    );
  }

  const reportData: Record<string, GuideDiscussionResult> = {};
  reportData['total'] = getTotalRow();
  for (const key of filteredEvents) {
    const guidedEvents: EventTracking[] = await AWSEventTracking.findAllByCustomKeyStartsWith(
      config,
      key,
      EventType.GuidedDiscussionEvent,
    );

    const purchaseEvents = guidedEvents.filter((e) => e.event === GuidedDiscussionEvents.PackageInfo);
    let reportEntry = reportData[key];

    // Handle purchase events
    if (purchaseEvents.length === 1 && purchaseEvents[0].products.length > 1) {
      reportEntry = createEmptyGDReportObject(purchaseEvents[0], reportData['total'], BundleType.Both);
    } else if (purchaseEvents.length === 2) {
      for (const purchaseEvent of purchaseEvents) {
        if (purchaseEvent.products.length !== 1) continue;
        const product = purchaseEvent.products[0];

        if (!reportEntry) {
          reportEntry = createEmptyGDReportObject(purchaseEvent, reportData['total'], product);
          continue;
        }

        if (product === BundleType.Survey) {
          Object.assign(reportEntry, {
            mwiPurchaseDate: purchaseEvent.createdAt,
            mwiPurchasePrice: purchaseEvent.price,
            mwiDiscount: purchaseEvent.discountAmount,
          });
        } else if (product === BundleType.GuidedDiscussion) {
          Object.assign(reportEntry, {
            gdPurchaseDate: purchaseEvent.createdAt,
            gdPurchasePrice: purchaseEvent.price,
            gdDiscount: purchaseEvent.discountAmount,
            gdStatus: GuidedReportCompletionStatus.Unscheduled,
          });
        }
      }
    }

    // Save entry back if it was created
    if (reportEntry) {
      reportData[key] = reportEntry;
    }

    // Handle Completion Status Events
    const compilationStatuses = guidedEvents
      .filter((e) => e.event === GuidedDiscussionEvents.CompletionStatus)
      .sort((a, b) => b.createdAt! - a.createdAt!);

    if (compilationStatuses.length > 0 && reportEntry) {
      const [latest] = compilationStatuses;
      const requestReschedule = guidedEvents.filter((e) => e.event === GuidedDiscussionEvents.RescheduleRequested);
      if (requestReschedule != null && latest.status === GuidedReportCompletionStatus.Unscheduled) {
        reportEntry.gdStatus = GuidedReportCompletionStatus.Unscheduled;
      } else {
        reportEntry.gdStatus = latest.status;

        for (const statusEvent of compilationStatuses) {
          const date = timestampToDateForReport(statusEvent.createdAt);
          switch (statusEvent.status) {
            case GuidedReportCompletionStatus.Complete:
              reportEntry.completedGdDate = date;
              reportData['total'].completedGdDate = increment(reportData['total'].completedGdDate);
              break;
            case GuidedReportCompletionStatus.Cancel:
              reportEntry.cancelledGdDate = date;
              reportData['total'].cancelledGdDate = increment(reportData['total'].cancelledGdDate);
              break;
            case GuidedReportCompletionStatus.Scheduled:
              reportEntry.scheduledGdDate = date;
              reportData['total'].scheduledGdDate = increment(reportData['total'].scheduledGdDate);
              break;
          }
        }
      }
    }

    // Handle Explorer/Guide/FocusAreas events
    for (const e of guidedEvents) {
      if (!reportEntry) continue;

      switch (e.event) {
        case GuidedDiscussionEvents.Explorer:
          reportEntry.explorerName = e.name;
          reportEntry.explorerEmail = e.email;
          reportData['total'].explorerEmail = increment(reportData['total'].explorerEmail);
          break;
        case GuidedDiscussionEvents.Guide:
          if (reportEntry.gdStatus != GuidedReportCompletionStatus.Unscheduled) {
            reportEntry.guideName = e.name;
            reportEntry.guideEmail = e.email;
            reportData['total'].guideEmail = increment(reportData['total'].guideEmail);
          }
          break;
        case GuidedDiscussionEvents.FocusAreasStarted:
          if (reportEntry.gdStatus != GuidedReportCompletionStatus.Unscheduled) {
            reportEntry.preWorkSubmittedDate = e.createdAt || '';
            reportData['total'].preWorkSubmittedDate = increment(reportData['total'].preWorkSubmittedDate);
          }
          break;
      }
    }
  }

  return Object.values(reportData);
}

interface ReportItem {
  often: number;
  sometimes: number;
  seldom: number;
  neverHardlyEver: number;
  alwaysAlmostAlways: number;
  timesChosenAsFocusArea: number;
}
export async function responseReport(startOfDate: number, endOfDate: number): Promise<ResponseReportResult[]> {
  const reportData: Record<string, ResponseReportResult> = {};
  const questionsKey = Object.keys(MWIQuestions);
  for (const item of questionsKey) {
    reportData[item] = {
      question: MWIQuestions[item],
      neverHardlyEver: 0,
      seldom: 0,
      sometimes: 0,
      often: 0,
      alwaysAlmostAlways: 0,
      timesChosenAsFocusArea: 0,
    } as ResponseReportResult;
  }
  const answers: SurveyAnswer[] = await findAllForResponsReport(startOfDate, endOfDate);
  const momAnswers: SurveyAnswer[] = await findAllForResponsReport(startOfDate, endOfDate);
  const guidedDiscussions: GuidedDiscussion[] = await findAllDiscussionsForResponseReport(startOfDate, endOfDate);
  const momWorkbook: WlfBuilderWorkbook[] = await Effect.runPromise(getWorkbooksByDate(startOfDate, endOfDate));
  [...answers, ...momAnswers].forEach((answer) => {
    const answersJson = answer.answers ? JSON.parse(answer.answers) : null;

    if (answersJson && Object.keys(answersJson).length == questionsKey.length) {
      Object.entries(answersJson).forEach(([key, value]) => {
        const reportMap: Record<string, keyof ReportItem> = {
          Often: 'often',
          Sometimes: 'sometimes',
          Seldom: 'seldom',
          'Never/hardly ever': 'neverHardlyEver',
          'Always/almost always': 'alwaysAlmostAlways',
        };

        const field = reportMap[value as keyof typeof reportMap];
        if (field && key in reportData) {
          reportData[key][field] = increment(reportData[key][field]);
        }
      });
    }
  });

  const reportDataKeys = Object.keys(reportData);
  guidedDiscussions.forEach((guidedDiscussion) => {
    guidedDiscussion.inventoryItems?.forEach((item) => {
      if (reportDataKeys.includes(item)) {
        reportData[item].timesChosenAsFocusArea = increment(reportData[item].timesChosenAsFocusArea);
      }
    });
  });
  momWorkbook.forEach((workbook) => {
    workbook.focus_areas?.forEach((item) => {
      if (reportDataKeys.includes(item)) {
        reportData[item].timesChosenAsFocusArea = increment(reportData[item].timesChosenAsFocusArea);
      }
    });
  });

  return Object.values(reportData);
}
export async function countFunnelReprot(
  config: IConfig,
  startOfDate: number,
  endOfDate: number,
): Promise<CountFunnelReportResult[]> {
  const [brandEvents, guidedEvents] = await Promise.all([
    AWSEventTracking.findAllOfType(config, startOfDate, endOfDate, EventType.BrandAndCommsEvent),
    AWSEventTracking.findAllOfType(config, startOfDate, endOfDate, EventType.GuidedDiscussionEvent),
  ]);

  const reportData: Record<string, CountFunnelReportResult> = {};

  const updateReportData = (date: string, key: keyof CountFunnelReportResult) => {
    if (!reportData[date]) {
      reportData[date] = createEmptyCountFunnelReportObject();
      reportData[date].date = date;
    }
    (reportData[date][key] as number)++;
  };

  for (const event of brandEvents) {
    const dateInfo = formatEpochToDayMon(event.createdAt!);
    if (event.event === BrandAndCommsEvents.Started) {
      updateReportData(dateInfo, 'started_mwi');
    } else if (event.event === BrandAndCommsEvents.Completed) {
      updateReportData(dateInfo, 'completed_mwi');
    }
  }

  for (const event of guidedEvents) {
    if (event.event === GuidedDiscussionEvents.PackageInfo && event.products?.length > 0) {
      const dateInfo = formatEpochToDayMon(event.createdAt!);
      if (event.products.length === 2) {
        updateReportData(dateInfo, 'bundle_purchase');
      } else if (event.products.includes(BundleType.Survey)) {
        updateReportData(dateInfo, 'mwi_report_only_purchase');
      }
    }
  }
  const reportArray = Object.values(reportData);

  // Calculate total object
  const total: CountFunnelReportResult = createEmptyCountFunnelReportObject();
  total.date = 'total';

  for (const entry of reportArray) {
    total.started_mwi += entry.started_mwi;
    total.completed_mwi += entry.completed_mwi;
    total.bundle_purchase += entry.bundle_purchase;
    total.mwi_report_only_purchase += entry.mwi_report_only_purchase;
  }

  return [total, ...reportArray];
}
function createEmptyMRReportObject(): MirrorReflectionResult {
  return {
    email: '',
    firstName: '',
    lastName: '',
    startedDate: '',
    completedDate: '',
    prompt_1_answered_date: '',
    prompt_2_answered_date: '',
    prompt_3_answered_date: '',
    prompt_4_answered_date: '',
    prompt_5_answered_date: '',
    prompt_6_answered_date: '',
    prompt_7_answered_date: '',
    prompt_8_answered_date: '',
  };
}
function createEmptyWlfAnonymousReportObject(key: string): WLFAnonymousResult {
  return {
    worklifeArea: key,
    e1: 0,
    e2: 0,
    e3: 0,
    e4: 0,
    e5: 0,
    i1: 0,
    i2: 0,
    i3: 0,
    i4: 0,
    i5: 0,
    aligned: 0,
    growthOpportunities: 0,
    hiddenStrengths: 0,
  };
}
function createEmptyBuilderReportObject(): WlfBuilderReportResult {
  return {
    email: '',
    purchaseDate: '',
    promoCode: '',
    inventoryCompletedDate: '',
    initialReflectionCompletedDate: '',
    deeperExplorationCompletedDate: '',
    pathForwardCompletedDate: '',
    registrationSource: '',
  };
}
function createEmptyCountFunnelReportObject(): CountFunnelReportResult {
  return {
    date: '',
    started_mwi: 0,
    completed_mwi: 0,
    mwi_report_only_purchase: 0,
    bundle_purchase: 0,
  };
}
function createEmptyGDReportObject(
  purchaseEvent: EventTracking,
  totalRow: GuideDiscussionResult,
  bundleType: BundleType,
): GuideDiscussionResult {
  switch (bundleType) {
    case BundleType.Survey:
      totalRow.mwiPurchaseDate = increment(totalRow.mwiPurchaseDate);
      totalRow.mwiPurchasePrice += purchaseEvent.price;
      break;
    case BundleType.GuidedDiscussion:
      totalRow.gdPurchaseDate = increment(totalRow.gdPurchaseDate);
      totalRow.gdPurchasePrice += purchaseEvent.price;
      break;
    case BundleType.Both:
      totalRow.gdBundlePurchaseDate = increment(totalRow.gdBundlePurchaseDate);
      totalRow.gdBundlePurchasePrice += purchaseEvent.price;
      break;
  }
  return {
    explorerName: '',
    explorerEmail: '',
    gdBundlePurchasePrice: bundleType === BundleType.Both ? purchaseEvent.price : 0,
    gdBundleDiscount: bundleType === BundleType.Both ? (purchaseEvent.discountAmount ?? 0) : 0,
    gdBundlePurchaseDate: bundleType === BundleType.Both ? purchaseEvent?.createdAt : '',
    mwiPurchasePrice: bundleType === BundleType.Survey ? purchaseEvent.price : 0,
    mwiDiscount: bundleType === BundleType.Survey ? (purchaseEvent.discountAmount ?? 0) : 0,
    mwiPurchaseDate: bundleType === BundleType.Survey ? purchaseEvent?.createdAt : '',
    gdPurchasePrice: bundleType === BundleType.GuidedDiscussion ? purchaseEvent.price : 0,
    gdDiscount: bundleType === BundleType.GuidedDiscussion ? (purchaseEvent.discountAmount ?? 0) : 0,
    gdPurchaseDate: bundleType === BundleType.GuidedDiscussion ? purchaseEvent?.createdAt : '',
    guideName: '',
    guideEmail: '',
    cancelledGdDate: '',
    completedGdDate: '',
    gdStatus: bundleType !== BundleType.Survey ? GuidedReportCompletionStatus.Unscheduled : '',
    preWorkSubmittedDate: '',
    scheduledGdDate: '',
  } as GuideDiscussionResult;
}
function getTotalRow(): GuideDiscussionResult {
  return {
    explorerName: 'Total',
    explorerEmail: 0,
    gdBundlePurchasePrice: 0,
    gdBundleDiscount: '-',
    gdBundlePurchaseDate: 0,
    mwiPurchasePrice: 0,
    mwiDiscount: '-',
    mwiPurchaseDate: 0,
    gdPurchasePrice: 0,
    gdDiscount: '-',
    gdPurchaseDate: 0,
    guideName: '',
    guideEmail: 0,
    cancelledGdDate: 0,
    completedGdDate: 0,
    gdStatus: '',
    preWorkSubmittedDate: 0,
    scheduledGdDate: 0,
  } as GuideDiscussionResult;
}
function increment(num: string | number): number {
  if (typeof num === 'string') {
    return 0;
  } else {
    return ++num;
  }
}
