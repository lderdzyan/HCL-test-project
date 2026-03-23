import { ListTopicsCommand, PublishCommand, SNSClient, Topic } from '@aws-sdk/client-sns';
import { IConfig } from './config';
import { createId } from '@paralleldrive/cuid2';

export async function sendMessage(config: IConfig, topicName: string, message: Record<string, any>) {
  const client = new SNSClient({ region: config.region });
  const topic = await getTopic(config, topicName);
  await client.send(
    new PublishCommand({
      TopicArn: topic?.TopicArn,
      Message: JSON.stringify({ default: JSON.stringify(message) }),
      MessageStructure: 'json',
      MessageGroupId: topicName,
      MessageDeduplicationId: createId(),
    }),
  );
}

async function getTopic(config: IConfig, topicName: string): Promise<Topic | undefined> {
  const client = new SNSClient({ region: config.region });
  const topics = await client.send(new ListTopicsCommand({}));
  return topics.Topics?.find((topic) => topic.TopicArn?.endsWith(`:${topicName}.fifo`));
}
