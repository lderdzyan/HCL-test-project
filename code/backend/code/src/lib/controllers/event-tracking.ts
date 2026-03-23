import { EventTracking, EventType, GuidedDiscussionEvents, createEventTracking } from '../entities/event-tracking';
import { Payment } from '../entities/payment';
import { findPersonById, getFullName, Person } from '../entities/person';
import { getPromoCodeById, PromoCode } from '../entities/promo-service/promo-code';
import { findAllUsersByPid, UserProfile } from '../entities/user-profile';
import { currentAt } from '../entity';
import { Logger } from '../logger';
import { publishMessage } from '../publish-message';
import { BrandAndCommsEvents, WlfBuilderEvents, WlfEvents } from '../report/constants';
import { respond } from '../request';
import * as TE from 'fp-ts/TaskEither';
import * as T from 'fp-ts/Task';
import * as O from 'fp-ts/Option';
import { pipe } from 'fp-ts/lib/function';
import { PackageController } from './package';
import { PersonController } from './person';
import { UserController } from './user';
import { MirrorReflectionAnswer } from '../entities/mirror-reflection/mirror-reflection';

export namespace EventTrackingController {
  export interface IPromoReport {
    type: EventType;
    email: string;
    payedAmount: number;
    firstName: string;
    lastName: string;
    packageName: string;
    promoCode: string;
    paymentId: string;
    customKey: string;
  }
  export async function addBrandAndCommsEvent(email: string, pid: string, event: BrandAndCommsEvents) {
    await createEventTracking(
      {
        type: EventType.BrandAndCommsEvent,
        email,
        personId: pid,
        event,
      },
      pid,
    );
  }
  export async function addIndicatorEvent(
    pid: string,
    event: WlfEvents,
    customData?: { [key: string]: string | number | string[] },
  ) {
    const users: UserProfile[] = await findAllUsersByPid(pid);
    try {
      const eventData = {
        type: EventType.WlfIndicatorEvent,
        personId: pid,
        event,
        customKey: `${pid}_${event}`,
        createdAt: currentAt(),
        email: users.length > 0 ? users[0].email! : '',
      } as EventTracking;
      if (customData != null) {
        const keys: string[] = Object.keys(customData);
        for (const key of keys) eventData[key] = customData[key];
      }
      await publishMessage('event-tracking', respond({ e: eventData }, { pid }));
    } catch (error) {
      Logger.error(`Error while creating event tracking ${error}`);
      console.log('error', error);
    }
  }
  export async function addWlfBuilderEvent(
    pid: string,
    event: WlfBuilderEvents,
    customData?: { [key: string]: string | number | string[] },
  ) {
    const users: UserProfile[] = await findAllUsersByPid(pid);
    try {
      const eventData = {
        type: EventType.WlfBuilderEvent,
        personId: pid,
        event,
        customKey: `${pid}_${event}`,
        createdAt: currentAt(),
        email: users.length > 0 ? users[0].email! : '',
      } as EventTracking;
      if (customData != null) {
        const keys: string[] = Object.keys(customData);
        for (const key of keys) eventData[key] = customData[key];
      }
      await publishMessage('event-tracking', respond({ e: eventData }, { pid }));
    } catch (error) {
      Logger.error(`Error while creating event tracking ${error}`);
      console.log('error', error);
    }
  }
  export async function addGuidedDiscussionEvent(
    discussionId: string,
    pid: string,
    event: GuidedDiscussionEvents,
    customData?: { [key: string]: string | number | string[] },
  ) {
    try {
      const eventData = {
        type: EventType.GuidedDiscussionEvent,
        discussionId,
        personId: pid,
        event,
        customKey: `${discussionId}_${currentAt()}_${event}`,
        createdAt: currentAt(),
      } as EventTracking;
      if (customData != null) {
        const keys: string[] = Object.keys(customData);
        for (const key of keys) eventData[key] = customData[key];
      }
      await publishMessage('event-tracking', respond({ e: eventData }, { pid }));
    } catch (error) {
      Logger.error(`Error while creating event tracking ${error}`);
      console.log('error', error);
    }
  }
  export async function addGuidedDiscussionUserInfo(
    discussionId: string,
    pid: string,
    event: GuidedDiscussionEvents,
    personId: string,
  ) {
    const person: Person | undefined = await findPersonById(personId);
    const users: UserProfile[] = await findAllUsersByPid(personId);

    if (person != null && users.length > 0) {
      await addGuidedDiscussionEvent(discussionId, pid, event, { name: getFullName(person), email: users[0].email! });
    }
  }

  export const addPromoReportData = (payment: Payment, personId: string) =>
    pipe(
      collectReportData(payment, personId),
      TE.chainFirstTaskK((data) => sendMessage(data, personId)),
    );

  const collectReportData = (payment: Payment, personId: string): TE.TaskEither<Error, IPromoReport> =>
    pipe(
      getPromoCodeById(payment.promoCodeId!),
      TE.chain(
        O.fold(() => TE.left<Error, PromoCode>(new Error('Promo code not exists.')), TE.right<Error, PromoCode>),
      ),
      TE.chain((promoCode) =>
        pipe(
          PersonController.getPersonById(personId),
          TE.chain(O.fold(() => TE.left<Error, Person>(new Error('Person not found')), TE.right<Error, Person>)),
          TE.chain((person) =>
            pipe(
              PackageController.loadPackageInfo(payment.packageId!),
              TE.chain(
                O.fold(
                  () => TE.left<Error, PackageController.PackageInfo>(new Error('Package not found')),
                  TE.right<Error, PackageController.PackageInfo>,
                ),
              ),
              TE.chain((packageInfo) =>
                pipe(
                  UserController.getUsersByPersonId(personId),
                  TE.map((users) => {
                    return {
                      type: EventType.PromoCodeUsageEvent,
                      email: users.length > 0 ? users[0].email! : '',
                      payedAmount: payment.amount!,
                      firstName: person.firstName ?? '',
                      lastName: person.lastName ?? '',
                      packageName: packageInfo.name,
                      promoCode: promoCode.promoCode,
                      paymentId: payment.id,
                      customKey: payment.id,
                    } as IPromoReport;
                  }),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  const addPackageAndPromoCodeInfo = (
    packageInfo: PackageController.PackageInfo,
    payment: Payment,
  ): TE.TaskEither<Error, PromoCode> =>
    pipe(
      getPromoCodeById(payment.promoCodeId!),
      TE.chain(
        O.fold(() => TE.left<Error, PromoCode>(new Error('Promo code not exists.')), TE.right<Error, PromoCode>),
      ),
      TE.chain((promoCode) => {
        pipe(
          TE.tryCatch(
            async () =>
              await EventTrackingController.addGuidedDiscussionEvent(
                payment.answerId!,
                payment.personId,
                GuidedDiscussionEvents.PackageInfo,
                {
                  price: payment.totalAmount!,
                  discountAmount: promoCode.discountAmount ?? promoCode.discountPercent ?? 0,
                  products: packageInfo.products!.map((item) => item.shortName),
                  createdAt: payment.orderDateTimestamp!,
                },
              ),
            (reason) => `Error: ${String(reason)}`,
          ),
        )();
        return TE.right(promoCode);
      }),
    );
  export async function addPackageInformation(payment: Payment, packageInfo: PackageController.PackageInfo) {
    if (payment.promoCodeId) await addPackageAndPromoCodeInfo(packageInfo, payment)();
    else {
      await EventTrackingController.addGuidedDiscussionEvent(
        payment.answerId!,
        payment.personId,
        GuidedDiscussionEvents.PackageInfo,
        {
          price: payment.totalAmount!,
          discountAmount: packageInfo.discount!,
          products: packageInfo.products!.map((item) => item.shortName),
          createdAt: payment.orderDateTimestamp!,
        },
      );
    }
  }

  export const sendMessage =
    (eventData: Record<string, any>, pid: string): T.Task<void> =>
    () =>
      publishMessage('event-tracking', respond({ e: eventData }, { pid }));

  export const addMirrorReflectionData = (
    answers: MirrorReflectionAnswer,
    personId: string,
  ): TE.TaskEither<string, EventTracking> => {
    return TE.tryCatch(
      async () => {
        function removeExtraSpaces(sentence: string): string {
          return sentence.trim().replace(/\s+/g, '_').toLowerCase();
        }

        const feelingWords = (answers['mr-2'].answer as Array<string>).map((word: string) => removeExtraSpaces(word));
        const topics = (answers['mr-7'].answer as Array<string>).map((word: string) => removeExtraSpaces(word));
        const workLife = removeExtraSpaces(answers['mr-8'].answer as string);

        const eventData: EventTracking = {
          personId,
          type: EventType.MRAnalyticsEvent,
          feelingWords,
          topics,
          workLife,
          createdAt: currentAt(),
        };

        return eventData;
      },
      (error) => `Error: ${error}`,
    );
  };

  export const addMirrorReflectionEvent = (answers: MirrorReflectionAnswer, personId: string) =>
    pipe(
      addMirrorReflectionData(answers, personId),
      TE.chainFirstTaskK((data) => sendMessage(data, personId)),
    );
}
