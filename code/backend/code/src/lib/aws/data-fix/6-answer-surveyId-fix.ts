import { SurveyAnswer, updateSurveyAnswer } from "../../entities/survey-answer";
import { Logger } from "../../logger";
import { IConfig } from "../config";
import { SortKey, queryByAttr } from "../dynamodb";

export async function migrateAnswerDetailsSurveyId(config: IConfig, surveyId: string) {
  const answerDetails = await getAllSurveyAnswers(config);

  Logger.info(`Found ${answerDetails.length} items to update.`);
  for (const answer of answerDetails) {
    answer.surveyId = surveyId;
    await updateSurveyAnswer(answer, answer.createdBy!, ['surveyId']);
  }
  Logger.info('Done answerDetails updated.');
}
async function getAllSurveyAnswers(config: IConfig): Promise<SurveyAnswer[]> {
  const items = await queryByAttr(
    config,
    'attr1',
    'qi86gc3pwiz5lw8zjf2gqbcu',
    SortKey.SurveyAnswer,
    '#attr = :attrValue',
    'attr1-index',
  );
  const answers: SurveyAnswer[] = [];

  for (const item of items) {
    if (item != null) {
      answers.push(item as SurveyAnswer);
    }
  }

  return answers
}
