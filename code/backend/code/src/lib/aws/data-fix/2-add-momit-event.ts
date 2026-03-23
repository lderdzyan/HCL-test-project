import { EventTracking, EventType } from '../../entities/event-tracking';
import { SurveyAnswer } from '../../entities/survey-answer';
import { IConfig } from '../config';
import { SortKey, queryByAttr, transactionalQueryies } from '../dynamodb';
import config from '../../../config';
import { NativeAttributeValue, TransactWriteCommandInput } from '@aws-sdk/lib-dynamodb';
import { UserProfile, findAllUsersByPid } from '../../entities/user-profile';

export namespace MomitEventController {
  export async function addMomitEvent(config: IConfig) {
    const answers: SurveyAnswer[] = await getAllSurveyAnswers(config);
    let items = [];

    for (const item of answers) {
      if (item.answers != null) {
        const answer: Record<string, string> = JSON.parse(item.answers);
        const keys: string[] = Object.keys(answer);
        if (keys.includes('mws-1') && item.id != null) {
          items.push(createEvent(item));
        }

        if (items.length == 100) {
          await writeToDb(config, items);
          items = [];
        }
      }
    }
    if (items.length > 0) {
      await writeToDb(config, items);
    }
  }

  export async function addEmailUsername(config: IConfig) {
    const items = await queryByAttr(
      { ...config, ddbTable: config.ddbTables.eventTracking },
      'attr4',
      0,
      EventType.MomitEvent,
      '#attr > :attrValue',
      'attr4-index',
    );
    const momitEvents: EventTracking[] = [];

    for (const item of items) {
      if (item != null) {
        momitEvents.push(item as EventTracking);
      }
    }

    const foundUserDetails: { [key: string]: UserProfile } = {};
    const itemsToUpdate: any[] = [];
    for (const event of momitEvents) {
      if (event['email'] == null || event['username'] == null || event['username'] === '') {
        let userDetails = foundUserDetails[event.personId];
        if (userDetails == null) {
          const userDetailsRecords = await findAllUsersByPid(event.personId);
          if (userDetailsRecords.length === 0) {
            continue;
          }

          userDetails = userDetailsRecords[0] as UserProfile;
          foundUserDetails[event.personId] = userDetails;
        }
        const expressionValues: Record<string, NativeAttributeValue> = {};
        expressionValues[':email'] = userDetails.email;
        expressionValues[':username'] = userDetails.username;

        let updateExpression = 'SET';
        if (userDetails.email != null) {
          updateExpression += ' email = :email';
        }
        if (userDetails.username != null) {
          if (updateExpression !== 'SET') {
            updateExpression += ',';
          }
          updateExpression += ' username = :username';
        }

        itemsToUpdate.push({
          Update: {
            TableName: config.ddbTables.eventTracking,
            Key: { _pk: event.id, _sk: EventType.MomitEvent },
            UpdateExpression: updateExpression,
            ExpressionAttributeValues: expressionValues,
          },
        });
      }
    }

    const chunkArray = [...chunks(itemsToUpdate, 100)];
    for (const chunk of chunkArray) {
      await writeToDb({ ...config, ddbTable: config.ddbTables.eventTracking }, chunk);
    }
  }
}

function* chunks(array: any[], n: number) {
  for (let i = 0; i < array.length; i += n) yield array.slice(i, i + n);
}

async function writeToDb(config: IConfig, items: any) {
  const params: TransactWriteCommandInput = {
    TransactItems: items,
  };

  try {
    const data = await transactionalQueryies(config, params);
    console.log('Transaction executed successfully', data);
  } catch (error: any) {
    console.error('Error executing transaction', error);
  }
}

function createEvent(item: SurveyAnswer) {
  return {
    Put: {
      TableName: config.awsConfig!.ddbTables.eventTracking,
      Item: {
        _pk: item.id!,
        _sk: EventType.MomitEvent,
        id: item.id!,
        personId: item.personId!,
        type: EventType.MomitEvent,
        surveyId: item.surveyId,
        createdAt: item.createdAt,
        createdOn: item.createdOn,
        pid: item.personId!,
      },
    },
  };
}

async function getAllSurveyAnswers(config: IConfig): Promise<SurveyAnswer[]> {
  const items = await queryByAttr(config, 'attr4', 0, SortKey.SurveyAnswer, '#attr > :attrValue', 'attr4-index');
  const answers: SurveyAnswer[] = [];

  for (const item of items) {
    if (item != null) {
      answers.push(item as SurveyAnswer);
    }
  }

  return answers;
}
