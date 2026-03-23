import { SortKey, createDocument, findByPartitionKey, updateDocument } from '.';
import { Survey } from '../../entities/survey';
import { IConfig } from '../config';
/*
 * attr3 (string) - createdBy
 * attr4 (number) - createdAt
 */
export async function findById(config: IConfig, id: string): Promise<Survey | undefined> {
  return (await findByPartitionKey(config, id, SortKey.Survey)) as Survey;
}

export async function createSurvey(config: IConfig, survey: Survey) {
  const document: Record<string, any> = { ...survey };
  document._pk = survey.id;
  document._sk = SortKey.Survey;
  document.attr3 = survey.createdBy;
  document.attr4 = survey.createdAt;

  await createDocument(config, document);
}
export async function updateSurvey(config: IConfig, survey: Survey, fieldsToUpdate: string[]) {
  const document: Record<string, any> = { ...survey };
  document._pk = survey.id;
  document._sk = SortKey.Survey;

  await updateDocument(config, document, fieldsToUpdate);
}
