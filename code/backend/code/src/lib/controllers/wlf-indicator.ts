import { pipe } from 'effect/Function';
import { getIndicatorByPid, updateIndicator, IndicatorAnswer } from '../entities/wlf-indicator/answer';
import { Effect } from 'effect/index';
import * as O from 'effect/Option';
import { SUPPORT_LINK, SurveyAnswerProcessStatus } from '../constants';
import { publishMessage } from '../publish-message';
import config from '../../config';
import { findAllMfaProfilesByPid, MfaProfile } from '../entities/mfa-profile';
import { Email, findEmailByMfaProfileId } from '../entities/email';
import { findAllUsersByPidAndEmail, UserProfile } from '../entities/user-profile';
import { findPersonById, Person } from '../entities/person';
import {
  createIndicatorTrainingPlan,
  getIndicatorTrainingPlanByPid,
  TrainingPlanStep,
  updateIndicatorTrainingPlan,
  IndicatorTrainingPlan,
} from '../entities/wlf-indicator/training-plan';
import { EventTrackingController } from './event-tracking';
import { WlfEvents } from '../report/constants';
import { deepMerge } from '../utils/array-utils';

export namespace IndicatorController {
  export interface IProcessesResult {
    area: string;
    exp: number;
    imp: number;
  }
  export interface Area {
    exp?: number;
    imp?: number;
  }

  export interface CategorizedItem {
    area: string;
    exp: number;
    imp: number;
  }

  interface Categories {
    growthOpportunities: CategorizedItem[];
    aligned: CategorizedItem[];
    hiddenStrengths: CategorizedItem[];
  }

  export const processAndUpdate = (wf: IndicatorAnswer, pid: string) =>
    pipe(
      Effect.sync(() => processResults(wf)),
      Effect.flatMap((extra) =>
        updateIndicator(
          { ...wf, processResult: JSON.stringify(extra), status: SurveyAnswerProcessStatus.Finished },
          pid,
          ['completedAt', 'processResult', 'status'],
        ),
      ),
      Effect.tap(() => processTaxamoWebhook(pid)),
      Effect.tap(() => Effect.promise(() => EventTrackingController.addIndicatorEvent(pid, WlfEvents.Completed))),
    );

  export const getInidicatorAnswers = (pid: string): Effect.Effect<O.Option<IndicatorAnswer>, Error, never> =>
    getIndicatorByPid(pid);

  export const processTaxamoWebhook = async (id: string): Promise<void> => {
    await Effect.runPromise(
      pipe(
        getIndicatorByPid(id),
        Effect.flatMap(
          O.match({
            onNone: () => Effect.fail(new Error('No existing Indicator')),

            onSome: (wlf) =>
              pipe(
                updateIndicator({ ...wlf, status: SurveyAnswerProcessStatus.Done }, id, ['status']),
                Effect.tap(() => emailSender(id)),
                Effect.flatMap(() =>
                  createIndicatorTrainingPlan({ step: TrainingPlanStep.Overview } as IndicatorTrainingPlan, id),
                ),
                Effect.map(() => void 0),
              ),
          }),
        ),
      ),
    );
  };

  const toNumber = (value: unknown): number | undefined => {
    if (value == null) return undefined;
    const s = String(value).trim().replace(',', '.');
    const n = Number(s);
    return Number.isFinite(n) ? n : undefined;
  };

  const processResults = (wlfAnswers: IndicatorAnswer): Categories => {
    const answers = JSON.parse(wlfAnswers.answers);
    const grouped: Record<string, Area> = {};

    for (const [key, value] of Object.entries(answers) as [string, string][]) {
      const [category, kindRaw] = key.split('-') as [string, string];
      if (kindRaw !== 'exp' && kindRaw !== 'imp') continue;
      const num = toNumber(value);
      if (num == null) continue;
      (grouped[category] ??= {})[kindRaw] = num;
    }

    return categorize(grouped);
  };

  function categorize(areas: Record<string, Area>): Categories {
    const result: Categories = {
      growthOpportunities: [],
      aligned: [],
      hiddenStrengths: [],
    };

    for (const [name, area] of Object.entries(areas)) {
      if (!isDefined(area)) continue;

      const item = { area: name, exp: area.exp, imp: area.imp };

      if (isGrowthOpportunity(area)) result.growthOpportunities.push(item);
      if (isAligned(area)) result.aligned.push(item);
      if (isHiddenStrength(area)) result.hiddenStrengths.push(item);
    }

    return result;
  }

  export const getPendingIndicator = (pid: string): Effect.Effect<O.Option<string>, Error, never> =>
    pipe(
      getIndicatorByPid(pid),
      Effect.map(
        O.flatMap((wlf) =>
          [SurveyAnswerProcessStatus.InProgress, SurveyAnswerProcessStatus.Finished].includes(wlf.status!)
            ? O.some(wlf.id!)
            : O.none(),
        ),
      ),
    );

  // Helper functions
  const isDefined = (a?: Area): a is Required<Area> => a?.exp != null && a?.imp != null;

  export const isGrowthOpportunity = (a?: Area) => isDefined(a) && a.exp < a.imp - 1;

  export const isAligned = (a?: Area) => isDefined(a) && Math.abs(a.exp - a.imp) < 2;

  export const isHiddenStrength = (a?: Area) => isDefined(a) && a.exp > a.imp + 1;

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
              subject: 'The Worklife Fulfillment Indicator',
              template: 'wlf-indicator-welcome',
              data: {
                wlf_link: `${config.host}/tools/indicator/#/training-plan/overview`,
                support_page_link: SUPPORT_LINK,
              },
            });
            return;
          }
        }
      }
    }
  };

  export const sendEmailIfNotSent = (pid: string): Effect.Effect<unknown, Error, void> =>
    pipe(
      getIndicatorByPid(pid),
      Effect.flatMap(
        O.match({
          onNone: () => Effect.succeed(undefined) as Effect.Effect<unknown, Error, void>,

          onSome: (existingPlan) => {
            if (existingPlan.isEmailSent) {
              return Effect.succeed(undefined);
            }

            return pipe(
              emailSender(pid),
              Effect.tap(() => updateIndicator({ ...existingPlan, isEmailSent: true }, pid, ['isEmailSent'])),
              Effect.map(() => void 0),
            );
          },
        }),
      ),
    );

  const sendEmailEffect = (pid: string) => Effect.tryPromise(() => sendEmail(pid));

  //Training plan functionality

  export const setTrainingPlanAnswersAndStep = (pid: string, data: IndicatorTrainingPlan) =>
    pipe(
      getIndicatorTrainingPlanByPid(pid),
      Effect.flatMap(
        O.match({
          onNone: () => createIndicatorTrainingPlan({ ...data, step: TrainingPlanStep.Overview }, pid),

          onSome: (existingPlan) =>
            pipe(
              updateIndicatorTrainingPlan(deepMerge(existingPlan, data), pid, Object.keys(data)),
              Effect.tap(() => createNeededEventForReport(data, pid)),
            ),
        }),
      ),
    );

  export const getTrainingPlan = (pid: string): Effect.Effect<IndicatorTrainingPlan | null, Error> =>
    pipe(getIndicatorTrainingPlanByPid(pid), Effect.map(O.getOrElse(() => null)));

  export const getPendingIndicatorTrainingPlan = (pid: string): Effect.Effect<O.Option<string>, Error, never> =>
    pipe(
      getIndicatorTrainingPlanByPid(pid),
      Effect.map(
        O.flatMap((trainingPlan) =>
          [TrainingPlanStep.Summary].includes(trainingPlan.step) ? O.none() : O.some(trainingPlan.id!),
        ),
      ),
    );

  const createNeededEventForReport = (data: IndicatorTrainingPlan, pid: string): Effect.Effect<void> => {
    switch (data.step) {
      case TrainingPlanStep.ChooseTargetAreas:
        return Effect.promise(() => EventTrackingController.addIndicatorEvent(pid, WlfEvents.WarmUpCompleted));
      case TrainingPlanStep.CompletePlan:
        return Effect.promise(() => EventTrackingController.addIndicatorEvent(pid, WlfEvents.TargetAreaCompleted));
      case TrainingPlanStep.Summary:
        return Effect.promise(() => EventTrackingController.addIndicatorEvent(pid, WlfEvents.TrainingPlanCompleted));
      default:
        return Effect.succeed(undefined);
    }
  };

  let emailSender = sendEmailEffect;
  export const __setEmailSenderForTests = (fn: typeof sendEmailEffect) => {
    emailSender = fn;
  };

  export const exportedForTesting = {
    processResults,
    categorize,
    sendEmail,
    createNeededEventForReport,
  };
}
