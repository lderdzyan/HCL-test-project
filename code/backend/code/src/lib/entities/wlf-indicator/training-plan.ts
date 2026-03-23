import { Entity } from '../../entity';
import { Effect } from 'effect';
import * as O from 'effect/Option';
import { callFunction } from '..';
import config from '../../../config';
import * as AWSWLFTrainingPlan from '../../aws/dynamodb/wlf-indicator/training-plan';

/**
 * {@link Entity}
 * @property {string} step
 */
export enum TrainingPlanStep {
  Overview = 'overview',
  WarmUp = 'warm_up',
  ChooseTargetAreas = 'choose_target_areas',
  CompletePlan = 'complete_plan',
  Summary = 'summary',
}
export interface IndicatorTrainingPlan extends Entity {
  step: TrainingPlanStep;
  [key: string]: any;
}
export const getIndicatorTrainingPlanByPid = (
  pid: string,
): Effect.Effect<O.Option<IndicatorTrainingPlan>, Error, never> =>
  callFunction(AWSWLFTrainingPlan.findById)(config.awsConfig!, pid);

export const createIndicatorTrainingPlan = (
  answers: IndicatorTrainingPlan,
  pid: string,
): Effect.Effect<string, Error, never> =>
  callFunction(AWSWLFTrainingPlan.createTrainingPlan)(config.awsConfig!, answers, pid);

export const updateIndicatorTrainingPlan = (
  data: IndicatorTrainingPlan,
  pid: string,
  fieldsToUpdate: string[],
): Effect.Effect<string, Error, never> =>
  callFunction(AWSWLFTrainingPlan.updateTrainingPlan)(config.awsConfig!, data, pid, fieldsToUpdate);
