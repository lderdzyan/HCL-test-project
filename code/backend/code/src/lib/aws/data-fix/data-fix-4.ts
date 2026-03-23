import { SurveyAnswerProcessStatus } from '../../constants';
import { SurveyAnswer, updateSurveyAnswer } from '../../entities/survey-answer';
import { Logger } from '../../logger';
import { IConfig } from '../config';
import { SortKey, queryByAttr } from '../dynamodb';

export async function migrateAnswerDetailsStatuses(config: IConfig) {
  const answerDetails = await getAllSurveyAnswers(config);

  Logger.info(`Found ${answerDetails.length} items to update.`);
  for (const answer of answerDetails) {
    await updateAnswersDetailsStatus(config, answer as SurveyAnswer);
  }
  Logger.info('Done answerDetails updated.');
}
async function updateAnswersDetailsStatus(config: IConfig, answer: SurveyAnswer) {
  if (answer == null || answer.id == null) return;

  if (answer.status == null) {
    if (answer.answers == null || answer.answers.length == 0) {
      answer.status = SurveyAnswerProcessStatus.Created;
    } else {
      answer.status = SurveyAnswerProcessStatus.Done;
    }
  }
  await updateSurveyAnswer(answer, answer.createdBy!, ['status']);
}

async function getAllSurveyAnswers(config: IConfig): Promise<SurveyAnswer[]> {
  const items = await queryByAttr(
    config,
    'attr4',
    0,
    SortKey.SurveyAnswer,
    '#attr > :attrValue',
    'attr4-index',
  );
  const answers: SurveyAnswer[] = [];

  for (const item of items) {
    if (item != null) {
      answers.push(item as SurveyAnswer);
    }
  }

  return answers
}
