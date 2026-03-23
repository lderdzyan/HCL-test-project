import { IConfig } from '.';
import { authenticate } from './aws/api-gateway';

export function loadAuth(config: IConfig) {
  switch (config.deploymenEnv) {
    case 'aws':
      return authenticate(config.awsConfig!);
    case 'azure':
      throw Error('Not implemented yet.');
  }
}
