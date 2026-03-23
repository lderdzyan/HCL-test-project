import { IConfig as MSConfig } from '..';

export interface IConfig {
  region: string;
  emailSender?: EmailSender;
  ddbTable: string;
  ddbTables: IDDBTables;
  uploadBucket: string;
  eventBridgeArn: string;
  credentials: {
    accessKeyId: string;
    secretAccessKey: string;
    sessionToken?: string;
  };
  stsConfig: IStsConfig;
  pageTrackingTtl: number;
}

export interface IStsConfig {
  uploadRoleArn?: string;
}

interface IDDBTables {
  main: string;
  tracking: string;
  eventTracking: string;
  scheduling: string;
  promoService: string;
  mirrorReflectionService: string;
  pocService: string;
}

enum Tables {
  'dev' = 'msinfraops-dev-moss-dev',
  'ua' = 'msinfraops-dev-moss-ua',
  'test' = 'msinfraops-dev-moss-test',
  'preprod' = 'msinfraops-dev-moss-preprod',
  'prod' = 'msinfraops-dev-moss-prod',
}
enum TrackingTables {
  'dev' = 'infraops-dev-tracking-dev',
  'ua' = 'infraops-dev-tracking-ua',
  'test' = 'infraops-dev-tracking-test',
  'preprod' = 'infraops-dev-tracking-preprod',
  'prod' = 'infraops-dev-tracking-prod',
}
enum EventTrackingTables {
  'dev' = 'msinfraops-events-dev',
  'ua' = 'msinfraops-events-ua',
  'test' = 'msinfraops-events-test',
  'preprod' = 'msinfraops-events-preprod',
  'prod' = 'msinfraops-events-prod',
}
enum SchedulingTables {
  'dev' = 'msinfraops-guides-dates-dev',
  'ua' = 'msinfraops-guides-dates-ua',
  'test' = 'msinfraops-guides-dates-test',
  'preprod' = 'msinfraops-guides-dates-preprod',
  'prod' = 'msinfraops-guides-dates-prod',
}
enum PromoServiceTables {
  'dev' = 'msinfraops-promo-service-dev',
  'ua' = 'msinfraops-promo-service-ua',
  'test' = 'msinfraops-promo-service-test',
  'preprod' = 'msinfraops-promo-service-preprod',
  'prod' = 'msinfraops-promo-service-prod',
}
enum MirrorReflectionServiceTables {
  'dev' = 'msinfraops-mirror-reflection-service-dev',
  'ua' = 'msinfraops-mirror-reflection-service-ua',
  'test' = 'msinfraops-mirror-reflection-service-test',
  'preprod' = 'msinfraops-mirror-reflection-service-preprod',
  'prod' = 'msinfraops-mirror-reflection-service-prod',
}
enum PoCTables {
  'dev' = 'msinfraops-poc-dev',
  'ua' = 'msinfraops-poc-ua',
  'test' = 'msinfraops-poc-test',
  'preprod' = 'msinfraops-poc-preprod',
  'prod' = 'msinfraops-poc-prod',
}

interface EmailSender {
  address: string;
  arn: string;
}

export function loadConfig(msConfig: MSConfig): IConfig {
  const config: Partial<IConfig> = {
    region: getRegion(),
    emailSender: getEmailSender(),
  };
  config.uploadBucket = process.env.AWS_UPLOAD_BUCKET_NAME;
  config.eventBridgeArn = process.env.AWS_EVENT_BRIDGE_ROLE_ARN;
  config.ddbTables = {
    main: Tables[msConfig.environment],
    tracking: TrackingTables[msConfig.environment],
    eventTracking: EventTrackingTables[msConfig.environment],
    scheduling: SchedulingTables[msConfig.environment],
    promoService: PromoServiceTables[msConfig.environment],
    mirrorReflectionService: MirrorReflectionServiceTables[msConfig.environment],
    pocService: PoCTables[msConfig.environment],
  };
  config.ddbTable = config.ddbTables.main;
  config.credentials = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? '',
    sessionToken: process.env.AWS_SESSION_TOKEN,
  };
  config.stsConfig = getSts();
  config.pageTrackingTtl = process.env.AWS_PAGE_TRACKING_TTL != null ? parseInt(process.env.AWS_PAGE_TRACKING_TTL) : 90;
  return config as IConfig;
}

function getRegion(): string {
  const env = process.env.AWS_REGION;

  if (env == null) throw new Error('AWS_REGION not defined.');

  return env;
}

function getEmailSender(): EmailSender | undefined {
  const address = process.env.MS_SENDER_EMAIL;
  const arn = process.env.MS_SENDER_ARN;

  if (address == null) return undefined;
  if (arn == null) return undefined;

  return { address, arn };
}

function getSts(): IStsConfig | undefined {
  return {
    uploadRoleArn: process.env.AWS_STS_ROLE_ARN ?? undefined,
  };
}
