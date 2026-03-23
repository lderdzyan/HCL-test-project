import { Entity } from '../../entity';
import { Effect } from 'effect';
import * as O from 'effect/Option';
import { callFunction } from '..';
import config from '../../../config';
import * as AWSWlfBuilderWorkbook from '../../aws/dynamodb/wlf-builder/workbook';

/**
 * {@link Entity}
 * @property {string} step
 */
export enum WorkbookStep {
  Overview = 'overview',
  Unity = 'unity',
  Service = 'service',
  Potential = 'potential',
  Integrity = 'integrity',
  BeingDoing = 'being_doing',
  SelfOthers = 'self_others',
  RealityInspiration = 'reality_inspiration',
  Wellbeing = 'wellbeing',
  FocusAreas = 'focus_areas', //Module 1
  DepeerExploration = 'deeper_exploration',
  IntegritySustain = 'integrate_sustain', //Module 2
  Summary = 'summary', //Module 3
}
export interface WlfBuilderWorkbook extends Entity {
  step: WorkbookStep;
  [key: string]: any;
  focus_areas?: string[];
}
export const getWlfBuilderWorkbookByPid = (pid: string): Effect.Effect<O.Option<WlfBuilderWorkbook>, Error, never> =>
  callFunction(AWSWlfBuilderWorkbook.findById)(config.awsConfig!, pid);

export const createWlfBuilderWorkbook = (
  answers: WlfBuilderWorkbook,
  pid: string,
): Effect.Effect<string, Error, never> =>
  callFunction(AWSWlfBuilderWorkbook.createWorkbook)(config.awsConfig!, answers, pid);

export const updateWlfBuilderWorkbook = (
  data: WlfBuilderWorkbook,
  pid: string,
  fieldsToUpdate: string[],
): Effect.Effect<string, Error, never> =>
  callFunction(AWSWlfBuilderWorkbook.updateWorkbook)(config.awsConfig!, data, pid, fieldsToUpdate);

export const getWorkbooksByDate = (
  startOfDate: number,
  endOfDate: number,
): Effect.Effect<WlfBuilderWorkbook[], Error, never> =>
  callFunction(AWSWlfBuilderWorkbook.findAllForReponseReport)(config.awsConfig!, startOfDate, endOfDate);
