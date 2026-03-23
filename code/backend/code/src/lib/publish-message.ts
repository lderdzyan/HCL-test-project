import config from '../config';
import * as sns from './aws/sns';

export async function publishMessage(topic: string, message: Record<string, any>) {
  switch (config.deploymenEnv) {
    case 'aws':
      await sns.sendMessage(config.awsConfig!, `${topic}-${config.environment}`, message);
      break;
    case 'azure':
      throw Error('Not implemented yet.');
  }
}
