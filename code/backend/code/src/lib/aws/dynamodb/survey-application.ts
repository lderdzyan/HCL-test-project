import { SortKey, createDocument, deleteByPartitionKey, queryByAttr } from '.';
import { SurveyApplication } from '../../entities/survey-application';
import { IConfig } from '../config';
/*
 * attr1 (string) - applicationId
 * attr2 (string) - surveyId
 * attr3 (string) - createdBy
 * attr4 (number) - createdAt
 */
export async function findAllByApplicationId(config: IConfig, applicationId: string): Promise<SurveyApplication[]> {
  const items = await queryByAttr(
    config,
    'attr1',
    applicationId,
    SortKey.ApplicationSurvey,
    '#attr = :attrValue',
    'attr1-index',
  );
  const applicationSurveys: SurveyApplication[] = [];

  for (const item of items) {
    applicationSurveys.push(item as SurveyApplication);
  }

  return applicationSurveys;
}

export async function createSurveyApplication(config: IConfig, survey: SurveyApplication) {
  const document: Record<string, any> = { ...survey };
  document._pk = survey.id;
  document._sk = SortKey.ApplicationSurvey;
  document.attr1 = survey.applicationId;
  document.attr2 = survey.surveyId;
  document.attr3 = survey.createdBy;
  document.attr4 = survey.createdAt;

  await createDocument(config, document);
}

export async function deleteSurveyApplication(config: IConfig, id: string) {
  await deleteByPartitionKey(config, id, SortKey.ApplicationSurvey);
}
