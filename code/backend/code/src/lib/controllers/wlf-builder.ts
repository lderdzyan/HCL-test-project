import { pipe } from 'effect/Function';
import { Effect } from 'effect/index';
import * as O from 'effect/Option';
import {
  createWlfBuilder,
  getWlfBuilderByPid,
  WlfBuilderAnswer,
  updateWlfBuilder,
} from '../entities/wlf-builder/answer';
import { Payment } from '../entities/payment';
import { findAllMfaProfilesByPid, MfaProfile } from '../entities/mfa-profile';
import { Email, findEmailByMfaProfileId } from '../entities/email';
import { findAllUsersByPidAndEmail, UserProfile } from '../entities/user-profile';
import { findPersonById, Person } from '../entities/person';
import { publishMessage } from '../publish-message';
import { SUPPORT_LINK } from '../constants';
import config from '../../config';
import { currentAt } from '../entity';
import { SurveyAnswerProcessStatus } from '../constants';
import { AnswerItem } from '../entities/survey-answer';
import { respond } from '../request';
import {
  createWlfBuilderWorkbook as createWlfBuilderWorkbook,
  getWlfBuilderWorkbookByPid as getWlfBuilderWorkbookByPid,
  WlfBuilderWorkbook as WlfBuilderWorkbook,
  updateWlfBuilderWorkbook as updateWlfBuilderWorkbook,
  WorkbookStep,
} from '../entities/wlf-builder/workbook';
import { deepMerge } from '../utils/array-utils';
import { EventTrackingController } from './event-tracking';
import { WlfBuilderEvents } from '../report/constants';
import { SurveyType } from '../entities/survey';

export namespace WlfBuilderController {
  export const getWlfBuilderAnwer = (pid: string): Effect.Effect<O.Option<WlfBuilderAnswer>, Error, never> =>
    pipe(getWlfBuilderByPid(pid), Effect.map(O.map((data) => data)));

  export const processTaxamoWebhook = async (payment: Payment, promoCode?: string): Promise<void> => {
    await Effect.runPromise(
      pipe(
        createWlfBuilder(payment.surveyId!, payment.personId!),
        Effect.tap(() => sendEmailEffect(payment.personId)),
        Effect.tap(() =>
          Effect.promise(() =>
            EventTrackingController.addWlfBuilderEvent(payment.personId, WlfBuilderEvents.PurchaseDate, {
              promoCode: promoCode ?? '',
            }),
          ),
        ),
      ),
    );
  };

  const sendEmail = async (pid: string): Promise<void> => {
    const mfaProfiles: MfaProfile[] = await findAllMfaProfilesByPid(pid);
    for (const mfaProfile of mfaProfiles) {
      const emailDetails: Email | undefined = await findEmailByMfaProfileId(mfaProfile.id!);
      if (emailDetails != null && emailDetails.active) {
        const user: UserProfile[] = await findAllUsersByPidAndEmail(pid, emailDetails.emailAddr);
        if (user.length > 0) {
          const person: Person | undefined = await findPersonById(pid);
          if (person != null && person.id === user[0].personId) {
            await publishMessage('send-email', {
              version: 1,
              to: [user[0].email],
              subject: 'Welcome to the Worklife Fulfillment Builder & Next Steps!',
              template: 'wlf-builder-welcome',
              data: {
                wlf_builder_link: `${config.host}/tools/builder/`,
                support_page_link: SUPPORT_LINK,
              },
            });
            return;
          }
        }
      }
    }
  };

  export const sendEmailIfNotSent = (pid: string): Effect.Effect<unknown, Error, never> =>
    pipe(
      getWlfBuilderByPid(pid),
      Effect.flatMap(
        O.match({
          onNone: () => Effect.succeed(undefined) as Effect.Effect<unknown, Error, never>,

          onSome: (existingPlan) => {
            if (existingPlan.isEmailSent) {
              return Effect.succeed(undefined);
            }

            return pipe(
              sendEmailEffect(pid),
              Effect.tap(() => updateWlfBuilder({ ...existingPlan, isEmailSent: true }, pid, ['isEmailSent'])),
            );
          },
        }),
      ),
    );

  export const sendEmailEffect = (pid: string) => Effect.tryPromise(() => sendEmail(pid));

  export const handleAnswers = (
    data: WlfBuilderAnswer,
    answer: AnswerItem,
    pid: string,
    finished: boolean,
  ): Effect.Effect<string, Error, never> =>
    pipe(
      Effect.sync(() => {
        const fieldsToUpdate = ['answers'];
        if (finished) {
          data.completedAt = currentAt();
          data.status = SurveyAnswerProcessStatus.Finished;
          fieldsToUpdate.push('completedAt', 'status');
        }
        data.answers = JSON.stringify({
          ...JSON.parse(data.answers ?? '{}'),
          ...answer,
        });
        return fieldsToUpdate;
      }),
      Effect.flatMap((fieldsToUpdate) => updateWlfBuilder(data, pid, fieldsToUpdate)),
      Effect.tap(() =>
        finished
          ? Effect.all(
              [
                Effect.promise(() =>
                  publishMessage('process-answer', respond({ answer: pid, type: SurveyType.WlfBuilder }, { pid })),
                ),
                Effect.promise(() => EventTrackingController.addWlfBuilderEvent(pid, WlfBuilderEvents.Completed)),
              ],
              { concurrency: 'unbounded', discard: true },
            )
          : Effect.succeed(undefined),
      ),
    );

  export const getWorkbook = (pid: string): Effect.Effect<WlfBuilderWorkbook | null, Error> =>
    pipe(getWlfBuilderWorkbookByPid(pid), Effect.map(O.getOrElse(() => null)));

  export const getPendingWlfBuilder = (pid: string): Effect.Effect<O.Option<string>, Error, never> =>
    pipe(
      getWlfBuilderByPid(pid),
      Effect.map(
        O.flatMap((builder) =>
          [SurveyAnswerProcessStatus.InProgress, SurveyAnswerProcessStatus.Finished].includes(builder.status!)
            ? O.some(builder.id!)
            : O.none(),
        ),
      ),
    );

  export const setWlfBuilderStep = (pid: string, data: WlfBuilderAnswer) =>
    pipe(
      getWlfBuilderByPid(pid),
      Effect.flatMap(
        O.match({
          onNone: () => Effect.fail(new Error('No existing Builder')),

          onSome: (existingMom) =>
            pipe(updateWlfBuilder(deepMerge(existingMom, data), pid, [Object.keys(data).join(',')])),
        }),
      ),
    );

  //Workbook functionality

  export const setWorkbookAnswersAndStep = (pid: string, data: WlfBuilderWorkbook) =>
    pipe(
      getWlfBuilderWorkbookByPid(pid),
      Effect.flatMap(
        O.match({
          onNone: () => createWlfBuilderWorkbook({ ...data, step: WorkbookStep.Overview }, pid),

          onSome: (existingPlan) =>
            pipe(
              updateWlfBuilderWorkbook(deepMerge(existingPlan, data), pid, Object.keys(data)),
              Effect.tap(() => createNeededEventForReport(data, pid)),
            ),
        }),
      ),
    );

  export const getPendingWlfBuilderWorkbook = (pid: string): Effect.Effect<O.Option<string>, Error, never> =>
    pipe(
      getWlfBuilderWorkbookByPid(pid),
      Effect.map(
        O.flatMap((workbook) => ([WorkbookStep.Summary].includes(workbook.step) ? O.none() : O.some(workbook.id!))),
      ),
    );

  export const createNeededEventForReport = (data: WlfBuilderWorkbook, pid: string): Effect.Effect<void> => {
    switch (data.step) {
      case WorkbookStep.FocusAreas:
        return Effect.promise(() => EventTrackingController.addWlfBuilderEvent(pid, WlfBuilderEvents.FirstModule));
      case WorkbookStep.IntegritySustain:
        return Effect.promise(() =>
          EventTrackingController.addWlfBuilderEvent(pid, WlfBuilderEvents.SecondModuleCompleted),
        );
      case WorkbookStep.Summary:
        return Effect.promise(() =>
          EventTrackingController.addWlfBuilderEvent(pid, WlfBuilderEvents.ThirdModuleCompleted),
        );
      default:
        return Effect.succeed(undefined);
    }
  };
}
