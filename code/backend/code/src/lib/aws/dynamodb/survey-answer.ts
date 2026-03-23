import { SortKey, createDocument, findByPartitionKey, queryByAttr, queryByAttrBetween, updateDocument } from '.';
import { SurveyAnswer } from '../../entities/survey-answer';
import { IConfig } from '../config';
/*
 * attr1 (string) - surveyId
 * attr2 (string) - personId
 * attr3 (string) - status
 * attr4 (number) - purchaseDate
 */
export async function findById(config: IConfig, id: string): Promise<SurveyAnswer | undefined> {
  return _fixAttributes(await findByPartitionKey(config, id, SortKey.SurveyAnswer));
}
export async function updateAnswer(config: IConfig, surveyAnswer: SurveyAnswer, fieldsToUpdate: string[]) {
  const document: Record<string, any> = { ...surveyAnswer };
  document._pk = surveyAnswer.id;
  document._sk = SortKey.SurveyAnswer;
  if (surveyAnswer.status != null) {
    document.attr3 = surveyAnswer.status;
    fieldsToUpdate.push('attr3');
  }
  if (surveyAnswer.surveyId != null) {
    document.attr1 = surveyAnswer.surveyId;
    fieldsToUpdate.push('attr1');
  }

  await updateDocument(config, document, fieldsToUpdate);
}
export async function updateResult(config: IConfig, surveyAnswer: SurveyAnswer) {
  const document: Record<string, any> = { ...surveyAnswer };
  document._pk = surveyAnswer.id;
  document._sk = SortKey.SurveyAnswer;
  document.attr3 = surveyAnswer.status;

  await updateDocument(config, document, ['processResult', 'status', 'attr3']);
}
export async function createSurveyAnswer(config: IConfig, surveyAnswer: SurveyAnswer) {
  const document: Record<string, any> = { ...surveyAnswer };
  document._pk = surveyAnswer.id;
  document._sk = SortKey.SurveyAnswer;
  document.attr1 = surveyAnswer.surveyId;
  document.attr3 = surveyAnswer.status;
  document.attr2 = surveyAnswer.personId;
  document.attr4 = surveyAnswer.purchaseDate;

  await createDocument(config, document);
}
export async function findAllByPersonId(config: IConfig, pid: string): Promise<SurveyAnswer[]> {
  const items = await queryByAttr(config, 'attr2', pid, SortKey.SurveyAnswer, '#attr = :attrValue', 'attr2-index');
  const answers: SurveyAnswer[] = [];

  for (const item of items) {
    const answer = _fixAttributes(item);
    if (answer != null) {
      answers.push(answer);
    }
  }

  return answers;
}
export async function findAll(config: IConfig, startOfDate: number, endOfDate: number): Promise<SurveyAnswer[]> {
  const items = await queryByAttrBetween({
    awsConfig: config,
    attrName: 'attr4',
    value1: startOfDate,
    value2: endOfDate,
    sortKeyValue: SortKey.SurveyAnswer,
    expression: '#attr BETWEEN :attrValue1 AND :attrValue2',
    index: 'attr4-index',
  });
  const answers: SurveyAnswer[] = [];

  for (const item of items) {
    const answer = _fixAttributes(item);
    if (answer != null) {
      answers.push(answer);
    }
  }

  return answers;
}
export async function findAllForResponsReport(
  config: IConfig,
  startOfDate: number,
  endOfDate: number,
): Promise<SurveyAnswer[]> {
  const items = await queryByAttrBetween({
    awsConfig: config,
    attrName: 'attr4',
    value1: startOfDate,
    value2: endOfDate,
    sortKeyValue: SortKey.SurveyAnswer,
    expression: '#attr BETWEEN :attrValue1 AND :attrValue2',
    index: 'attr4-index',
  });
  const answers: SurveyAnswer[] = [];

  for (const item of items) {
    const answer = _fixAttributes(item);
    if (answer != null) {
      answers.push(answer);
    }
  }

  return answers;
}
export async function findAllForMOMResponsReport(
  config: IConfig,
  startOfDate: number,
  endOfDate: number,
): Promise<SurveyAnswer[]> {
  const items = await queryByAttrBetween({
    awsConfig: config,
    attrName: 'attr4',
    value1: startOfDate,
    value2: endOfDate,
    sortKeyValue: SortKey.WlfBuilderAnswer,
    expression: '#attr BETWEEN :attrValue1 AND :attrValue2',
    index: 'attr4-index',
  });
  const answers: SurveyAnswer[] = [];

  for (const item of items) {
    const answer = _fixAttributes(item);
    if (answer != null) {
      answers.push(answer);
    }
  }

  return answers;
}
export async function updateSurveyPurchaseDate(config: IConfig, surveyAnswer: SurveyAnswer) {
  const document: Record<string, any> = { ...surveyAnswer };
  document._pk = surveyAnswer.id;
  document._sk = SortKey.SurveyAnswer;
  document.attr4 = surveyAnswer.purchaseDate;
  document.attr3 = surveyAnswer.status;

  await updateDocument(config, document, ['attr4', 'purchaseDate', 'attr3', 'status']);
}
function _fixAttributes(item?: Record<string, any>): SurveyAnswer | undefined {
  if (item == null) return undefined;

  const data = item as SurveyAnswer;

  if (data.id == null) data.id = item._pk;
  if (data.surveyId == null) data.surveyId = item.attr1;
  if (data.createdBy == null) {
    data.createdBy = item.attr2;
    data.personId = item.attr2;
  }
  if (data.purchaseDate == null) data.purchaseDate = item.attr4;

  return data;
}
