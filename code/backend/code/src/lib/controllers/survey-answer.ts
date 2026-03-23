import config from '../../config';
import {
  GuidedDiscussionStatus,
  PaymentStatus,
  ProductShortName,
  SUPPORT_LINK,
  SurveyAnswerProcessStatus,
} from '../constants';
import { Payment, findPaymentByPersonId } from '../entities/payment';
import { Person, findPersonById } from '../entities/person';
import {
  SurveyAnswer,
  findAllAnswersByPersonId,
  findSurveyAnswerById,
  updateSurveyAnswer,
  updateSurveyPurchaseDate,
} from '../entities/survey-answer';
import { findAllUsersByPidAndEmail, UserProfile } from '../entities/user-profile';
import { publishMessage } from '../publish-message';
import { respond } from '../request';
import { Product } from '../entities/product';
import { GuidedDiscussionController } from './guided-discussion';
import { isSome, Option } from 'fp-ts/lib/Option';
import { PackageController } from './package';
import { Logger } from '../logger';
import { EventTrackingController } from './event-tracking';
import { findAllMfaProfilesByPid, MfaProfile } from '../entities/mfa-profile';
import { Email, findEmailByMfaProfileId } from '../entities/email';
import { Effect } from 'effect/index';

export async function checkForPendingSurveyReport(user: UserProfile): Promise<void> {
  const surveyAnswers: SurveyAnswer[] = await findAllAnswersByPersonId(user.personId);
  const surveysNotProcessed: string[] = surveyAnswers
    .filter(
      (item: SurveyAnswer) =>
        item.processResult == null &&
        [SurveyAnswerProcessStatus.Finished, SurveyAnswerProcessStatus.Pending].includes(item.status!),
    )
    .map((item: SurveyAnswer) => item.id!);
  const payments: Payment[] = await findPaymentByPersonId(user.personId);
  const needToGenerate: Payment[] = payments.filter(
    (item: Payment) => item.status === PaymentStatus.Done && surveysNotProcessed.includes(item.answerId!),
  );

  for (const item of needToGenerate) {
    if (item.packageId != null) {
      const packageInfo: Option<PackageController.PackageInfo> = await PackageController.getPackageInfo(
        item.packageId!,
      );
      if (isSome(packageInfo)) {
        await findActiveEmailByPersonIdAndSendEmails(item.personId, packageInfo.value.products!, item.answerId!);
      }
    }
  }
}
export const checkForPendingSurveyReportEffect = (user: UserProfile): Effect.Effect<unknown, Error, void> =>
  Effect.tryPromise(() => checkForPendingSurveyReport(user));

export async function startToGenerateReport(payment: Payment, products?: Product[]) {
  try {
    await findActiveEmailByPersonIdAndSendEmails(payment.personId, products!, payment.answerId!);
  } catch (error) {
    Logger.error(`Error while generating report ${error}`);
    console.log('error', error);
  }
}
async function findActiveEmailByPersonIdAndSendEmails(personId: string, products: Product[], answerId: string) {
  const mfaProfiles: MfaProfile[] = await findAllMfaProfilesByPid(personId);
  for (const mfaProfile of mfaProfiles) {
    const emailDetails: Email | undefined = await findEmailByMfaProfileId(mfaProfile.id!);
    if (emailDetails != null && emailDetails.active) {
      const user: UserProfile[] = await findAllUsersByPidAndEmail(personId, emailDetails.emailAddr);
      if (user.length > 0) {
        const person: Person | undefined = await findPersonById(personId);
        if (person != null && person.id === user[0].personId && products != null) {
          await publishMessage('process-answer', respond({ answer: answerId }, { pid: personId }));
          await sendEmailBasedOnPurchase(products, user[0], answerId!);
          return;
        }
      }
    }
  }
}

export interface ISurveyAnswerResponse {
  errorMessage?: string;
  processResult?: Record<string, number>;
  answers?: Record<string, string>;
  surveyId?: string;
  personId?: string;
  purchaseDate?: number;
  completedAt?: number;
  createdAt: number;
  name?: string;
  status?: SurveyAnswerProcessStatus;
  id: string;
  packageInfo?: PackageController.PackageInfo[];
  guidedDiscussion?: {
    status: GuidedDiscussionStatus;
  };
}
export function convertToSurveyAnswerReponse(item: SurveyAnswer) {
  return {
    id: item.id!,
    processResult: item.processResult == null ? null : JSON.parse(item.processResult),
    answers: item.answers == null ? null : JSON.parse(item.answers),
    surveyId: item.surveyId,
    status: item.status,
    completedAt: item.completedAt,
    purchaseDate: item.purchaseDate,
    personId: item.personId,
    createdAt: item.createdAt!,
    name: item.name ?? 'Meaningful Work Inventory',
  } as ISurveyAnswerResponse;
}

async function sendEmailBasedOnPurchase(products: Product[], user: UserProfile, answerId: string) {
  if (products.length === 1) {
    switch (products[0].shortName) {
      case ProductShortName.Survey:
        await publishMessage('send-email', {
          version: 1,
          to: [user.email],
          subject: 'Your Meaningful Work Inventory Results & Next Steps!',
          template: 'moss-survey-report',
          data: {
            report_link: `${config.host}/tools/mwi/#/survey?surveyId=${answerId}&tab=report`,
            support_page_link: SUPPORT_LINK,
          },
        });
        break;
      case ProductShortName.GuidedDiscussion:
        await publishMessage('send-email', {
          version: 1,
          to: [user.email],
          subject: ' Schedule Your Guided Discussion!',
          template: 'guide-purchase-email',
          data: {
            support_page_link: SUPPORT_LINK,
          },
        });
        break;
    }
  } else if (products.length > 1) {
    const productsFiltered: Product[] = products.filter((item) =>
      [ProductShortName.GuidedDiscussion, ProductShortName.Survey].includes(item.shortName),
    );
    if (productsFiltered.length == 2) {
      await publishMessage('send-email', {
        version: 1,
        to: [user.email],
        subject: 'Your Meaningful Work Inventory Results & Next Steps!',
        template: 'mwi-survey-and-guide-report',
        data: {
          report_link: `${config.host}/tools/mwi/#/survey?surveyId=${answerId}&tab=report`,
          support_page_link: SUPPORT_LINK,
        },
      });
    }
  }
}
export async function updateSurveyAnswerStatus(id: string, status: PaymentStatus) {
  const answers: SurveyAnswer | undefined = await findSurveyAnswerById(id);
  if (answers != null) {
    if (status === PaymentStatus.Done) await updateSurveyPurchaseDate(answers);
    if (status === PaymentStatus.Failed) {
      answers.status = SurveyAnswerProcessStatus.PaymentError;
      await updateSurveyAnswer(answers, answers.personId!, ['status']);
    }
  }
}
export async function createGuidedDiscussionAndProcessAnswer(payment: Payment) {
  if (payment.packageId != null) {
    const packageInfo: Option<PackageController.PackageInfo> = await PackageController.getPackageInfo(
      payment.packageId,
    );
    if (isSome(packageInfo)) {
      const products = packageInfo.value.products!;
      if (products.length === 1 && products[0].shortName == ProductShortName.GuidedDiscussion) {
        await GuidedDiscussionController.initGuidedDiscussion(payment.answerId!, payment.personId!);
      } else if (products.length > 1) {
        const productsFiltered: Product[] = products.filter((item) =>
          [ProductShortName.GuidedDiscussion, ProductShortName.Survey].includes(item.shortName),
        );
        if (productsFiltered.length == 2) {
          await GuidedDiscussionController.initGuidedDiscussion(payment.answerId!, payment.personId!);
        }
      }
      await startToGenerateReport(payment, packageInfo.value.products);
      try {
        await EventTrackingController.addPackageInformation(payment, packageInfo.value);
      } catch (error) {
        console.log('error', error);
      }
    }
  }
}
