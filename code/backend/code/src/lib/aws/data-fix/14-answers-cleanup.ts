import { SurveyAnswer } from "../../entities/survey-answer";
import { IConfig } from "../config";
import { deleteByPartitionKey, IFilterData, queryByAttr, SortKey } from "../dynamodb";

export namespace AnswersCleanup {
  export async function doCleanup(config: IConfig) {
    const answers: SurveyAnswer[] = await getAllAnswers(config);

    console.log(answers.length);
    for (const item of answers) {
      await deleteAnswer(config, item.id!);
    }
    console.log('Deleted all.');
  }

  async function getAllAnswers(config: IConfig): Promise<SurveyAnswer[]> {
    const filters: IFilterData = {
      expression: 'attribute_not_exists(#filterAttr) or #filterAttr = :filterValue',
      names: { '#filterAttr': 'answers' },
      values: { ':filterValue': null }
    }
    const items = await queryByAttr(config, 'attr4', 0, SortKey.SurveyAnswer, '#attr > :attrValue', 'attr4-index', filters);

    const answers: SurveyAnswer[] = [];
    for (const item of items) {
      answers.push(item as SurveyAnswer);
    }

    return answers;
  }

  export async function deleteAnswer(config: IConfig, id: string) {
    await deleteByPartitionKey(config, id, SortKey.SurveyAnswer);
  }
}
