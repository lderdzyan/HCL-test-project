import * as dotenv from 'dotenv';
import * as AWS from './aws/config';
import * as Azure from './azure/config';

type MSDeploymentEnv = 'aws' | 'azure';
const MSDeploymentEnvs: MSDeploymentEnv[] = ['aws', 'azure'];
type MSEnvironment = 'dev' | 'ua' | 'preprod' | 'prod' | 'test';
const MSEnvironments: MSEnvironment[] = ['dev', 'ua', 'preprod', 'prod', 'test'];
export enum FileStorage {
  S3 = 's3',
}
const FileStorages: FileStorage[] = [FileStorage.S3];
enum Host {
  'dev' = 'https://dev.meaningsphere.cloud',
  'ua' = 'https://ua.meaningsphere.cloud',
  'test' = 'https://test.meaningsphere.cloud',
  'preprod' = 'https://ua.meaningsphere.com',
  'prod' = 'https://app.meaningsphere.com',
}
export interface ICalendlyConfig {
  organizationId: string;
  eventTypeSlug: string;
  token: string;
}
export interface IConfig {
  deploymenEnv: MSDeploymentEnv;
  environment: MSEnvironment;
  logAllowed: MSEnvironment[];
  awsConfig?: AWS.IConfig;
  azureConfig?: Azure.IConfig;
  host: Host;
  fileStorage?: FileStorage;
  calendlyConfig?: ICalendlyConfig;
  jwtSecret?: string;
  intranetReportTimezon: string;
}

function getDeploymentEnv(): MSDeploymentEnv {
  const env = process.env.MS_DEPLOY_ENV as MSDeploymentEnv;

  if (env == null) throw new Error('MS_DEPLOY_ENV not defined.');

  if (!MSDeploymentEnvs.includes(env)) throw new Error(`Unknown ${env} deployment environment.`);

  return env as MSDeploymentEnv;
}

function getEnvironment(): MSEnvironment {
  const env = process.env.MS_ENV as MSEnvironment;

  if (env == null) throw new Error('MS_ENV not defined.');

  if (!MSEnvironments.includes(env)) throw new Error(`Unknown ${env} environment.`);

  return env as MSEnvironment;
}
function getHost(): Host {
  switch (getEnvironment()) {
    case 'ua':
      return Host.ua;
    case 'preprod':
      return Host.preprod;
    case 'prod':
      return Host.prod;
    case 'test':
      return Host.test;
    default:
      return Host.dev;
  }
}

function getFileStorage(): FileStorage | undefined {
  const storage = process.env.MS_FILE_STORAGE as FileStorage;

  if (storage == null || !FileStorages.includes(storage)) return undefined;

  return storage as FileStorage;
}

function getCalendlyConfig(): ICalendlyConfig | undefined {
  if (
    process.env.CALENDLY_ORG_ID != null &&
    process.env.CALENDLY_EVENT_TYPE_SLUG != null &&
    process.env.CALENDLY_TOKEN != null
  ) {
    return {
      organizationId: process.env.CALENDLY_ORG_ID,
      eventTypeSlug: process.env.CALENDLY_EVENT_TYPE_SLUG,
      token: process.env.CALENDLY_TOKEN,
    };
  }
  return undefined;
}
export function loadConfig(): IConfig {
  dotenv.config();

  const config: IConfig = {
    deploymenEnv: getDeploymentEnv(),
    environment: getEnvironment(),
    logAllowed: ['dev', 'ua', 'preprod', 'test'],
    host: getHost(),
    fileStorage: getFileStorage(),
    calendlyConfig: getCalendlyConfig(),
    jwtSecret: process.env.JWT_SECRET,
    intranetReportTimezon: process.env.INTRANET_REPORT_TIMEZONE || 'America/New_York',
  };

  switch (config.deploymenEnv) {
    case 'aws': {
      config.awsConfig = AWS.loadConfig(config);
      break;
    }
    case 'azure':
      throw Error('Not implemented yet.');
  }

  return config;
}
