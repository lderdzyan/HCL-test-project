import { BatchGetItemCommand, BatchWriteItemCommand, DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  BatchGetCommandOutput,
  DeleteCommand,
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  QueryCommandInput,
  ScanCommand,
  ScanCommandInput,
  TransactWriteCommand,
  TransactWriteCommandInput,
  UpdateCommand,
  UpdateCommandInput,
} from '@aws-sdk/lib-dynamodb';
import * as TE from 'fp-ts/TaskEither';
import { pipe } from 'fp-ts/lib/function';
import { EventType } from '../../entities/event-tracking';
import { Entity } from '../../entity';
import { IConfig } from '../config';
import { Effect } from 'effect';

export enum SortKey {
  Application = 'applicationDetails',
  MfaProfile = 'mfaDetails',
  Email = 'emailDetails',
  UserProfile = 'userDetails',
  Person = 'personDetails',
  SurveyAnswer = 'answerDetails',
  GuiError = 'guiErrorDetails',
  PageTracking = 'pageTrackingDetails',
  DemographicData = 'surveyDemographicDetails',
  ReportData = 'reportData',
  FileUpload = 'fileUploadDetails',
  ReportPreference = 'reportPreferenceDetails',
  LoginData = 'loginDetails',
  JWKDetails = 'jwkDetails',
  AssignedJWKDetails = 'assignedJWKDetails',
  Subscription = 'subscribeDetails',
  Payment = 'paymentDetails',
  GuideProfile = 'guideProfileDetails',
  GuidedDiscussion = 'guidedDiscussionDetails',
  Survey = 'surveyDetails',
  ApplicationSurvey = 'applicationSurveyDetails',
  ApplicationPackage = 'applicationPackageDetails',
  Product = 'productDetails',
  Package = 'packageDetails',
  CalendlyData = 'calendlyDataDetails',
  GuidedDiscussionActions = 'guidedDiscussionActionsDetails',
  TaxamoResponse = 'taxamoResponseDetails',
  AvailableDates = 'availableDatesDetails',
  PromoCode = 'promoDetails',
  PromoCodeUsage = 'promoUsageDetails',
  PromoPackagesAssigned = 'promoPackagesAssigned',
  MirrorReflection = 'mirrorReflectionDetails',
  CustomFeeling = 'customFeelingDetails',
  MirrorReflectionSummary = 'mirrorReflectionSummaryDetails',
  MirrorReflectionBackgroundImage = 'mirrorReflectionBackgroundImageDetails',
  WlfIndicatorAnswer = 'wlfIndicatorAnswerDetails',
  WlfIndicatorTrainingPlan = 'wlfIndicatorTrainigDetails',
  WlfBuilderAnswer = 'wlfBuilderAnswerDetails',
  WlfBuilderWorkbook = 'wlfBuilderWorkbookDetails',
  SubjectsAssigned = 'subjectsAssigned',
  Role = 'roleDetails',
}
export enum DeletedSortKey {
  Package = 'deleted_packageDetails',
  GuideProfile = 'deleted_guideProfileDetails',
  MirrorReflection = 'deleted_mirrorReflectionDetails',
}
export enum PoCSortKey {
  TaxamoSubscription = 'taxSubscriptionDetails',
}
export interface IFilterData {
  expression: string;
  names: Record<string, any>;
  values: Record<string, any>;
}

export function getDynamoDbClient(awsConfig: IConfig) {
  let awsCredentials:
    | {
        secretAccessKey: string;
        accessKeyId: string;
        region: string;
        sessionToken?: string;
      }
    | undefined = undefined;
  if (awsConfig?.credentials != null) {
    awsCredentials = {
      region: awsConfig.region,
      accessKeyId: awsConfig.credentials.accessKeyId,
      secretAccessKey: awsConfig.credentials.secretAccessKey,
      sessionToken: awsConfig.credentials.sessionToken,
    };
  }
  return DynamoDBDocumentClient.from(
    new DynamoDBClient({
      region: awsConfig!.region,
      credentials: awsCredentials,
    }),
  );
}

export async function findByPartitionKey(
  awsConfig: IConfig,
  id: string,
  sortKey: SortKey,
): Promise<Record<string, any> | undefined> {
  const response = await getDynamoDbClient(awsConfig).send(
    new GetCommand({
      TableName: awsConfig.ddbTable,
      Key: { _pk: id, _sk: sortKey },
      ConsistentRead: true,
    }),
  );

  return response.Item;
}

export async function deleteByPartitionKey(aswConfig: IConfig, id: string, sortKey: SortKey | string): Promise<void> {
  await getDynamoDbClient(aswConfig).send(
    new DeleteCommand({
      TableName: aswConfig.ddbTable,
      Key: { _pk: id, _sk: sortKey },
    }),
  );
}

export async function createDocument(awsConfig: IConfig, document: Record<string, any>) {
  await getDynamoDbClient(awsConfig).send(new PutCommand({ TableName: awsConfig.ddbTable, Item: document }));
}

export async function updateDocument(awsConfig: IConfig, document: Record<string, any>, fieldsToUpdate: string[]) {
  const fields: string[] = [...fieldsToUpdate, 'updatedAt', 'updatedBy', 'updatedOn'];
  const names: Record<string, string> = {};
  const values: Record<string, any> = {};
  let updateExpression = 'SET ';
  for (const fieldName of fields) {
    updateExpression += `#${fieldName} = :${fieldName}, `;
    names[`#${fieldName}`] = fieldName;
    values[`:${fieldName}`] = document[fieldName];
  }
  if (updateExpression.endsWith(', ')) {
    updateExpression = updateExpression.substring(0, updateExpression.length - 2);
  }
  const command: UpdateCommandInput = {
    TableName: awsConfig.ddbTable,
    Key: { _pk: document._pk, _sk: document._sk },
    UpdateExpression: updateExpression,
    ExpressionAttributeNames: names,
    ExpressionAttributeValues: values,
  };

  await getDynamoDbClient(awsConfig).send(new UpdateCommand(command));
}

export async function removeAttr(awsConfig: IConfig, id: string, sortKey: SortKey, attribute: string) {
  const command = new UpdateCommand({
    TableName: awsConfig.ddbTable,
    Key: { _pk: id, _sk: sortKey },
    UpdateExpression: `REMOVE ${attribute}`,
    ReturnValues: 'ALL_NEW',
  });

  await getDynamoDbClient(awsConfig).send(command);
}

export async function queryByAttr(
  awsConfig: IConfig,
  attrName: string,
  value: string | number,
  sortKeyValue: SortKey | EventType | string,
  expression: string,
  index?: string,
  filterInfo?: IFilterData,
  limit: number = 1000,
): Promise<Record<string, any>[]> {
  const command: QueryCommandInput = {
    TableName: awsConfig.ddbTable,
    IndexName: index,
    KeyConditionExpression: `#sk = :sortKey AND ${expression}`,
    ExpressionAttributeNames: { '#sk': '_sk', '#attr': attrName },
    ExpressionAttributeValues: {
      ':sortKey': sortKeyValue,
      ':attrValue': value,
    },
    Limit: limit,
  };

  if (filterInfo != null && command.ExpressionAttributeNames != null && command.ExpressionAttributeValues != null) {
    command.FilterExpression = filterInfo.expression;
    for (const key of Object.keys(filterInfo.names)) {
      command.ExpressionAttributeNames[key] = filterInfo.names[key];
    }
    for (const key of Object.keys(filterInfo.values)) {
      command.ExpressionAttributeValues[key] = filterInfo.values[key];
    }
  }

  const response = await getDynamoDbClient(awsConfig).send(new QueryCommand(command));
  if (response?.Count != null && response.Count > 0 && response?.Items != null) {
    return response.Items;
  }
  return [];
}
export async function scanData(awsConfig: IConfig): Promise<Record<string, any>[]> {
  const command: ScanCommandInput = { TableName: awsConfig.ddbTable };

  const response = await getDynamoDbClient(awsConfig).send(new ScanCommand(command));
  if (response?.Count != null && response.Count > 0 && response?.Items != null) {
    return response.Items;
  }
  return [];
}

export async function scanDataWithFilterSortKey(
  awsConfig: IConfig,
  sortKeyValue: SortKey,
): Promise<Record<string, any>[]> {
  const command: ScanCommandInput = {
    TableName: awsConfig.ddbTable,
    FilterExpression: '#sk = :sortKey',
    ExpressionAttributeNames: {
      '#sk': '_sk',
    },
    ExpressionAttributeValues: {
      ':sortKey': sortKeyValue,
    },
  };

  const response = await getDynamoDbClient(awsConfig).send(new ScanCommand(command));
  if (response?.Count != null && response.Count > 0 && response?.Items != null) {
    return response.Items;
  }
  return [];
}
export type QueryByAttrBetweenArg = {
  awsConfig: IConfig;
  attrName: string;
  value1: string | number;
  value2: string | number;
  sortKeyValue: SortKey | EventType;
  expression: string;
  index: string;
  filterInfo?: IFilterData;
};
export async function queryByAttrBetween(data: QueryByAttrBetweenArg): Promise<Record<string, any>[]> {
  const command: QueryCommandInput = {
    TableName: data.awsConfig.ddbTable,
    IndexName: data.index,
    KeyConditionExpression: `#sk = :sortKey AND ${data.expression}`,
    ExpressionAttributeNames: { '#sk': '_sk', '#attr': data.attrName },
    ExpressionAttributeValues: {
      ':sortKey': data.sortKeyValue,
      ':attrValue1': data.value1,
      ':attrValue2': data.value2,
    },
  };

  if (
    data.filterInfo != null &&
    command.ExpressionAttributeNames != null &&
    command.ExpressionAttributeValues != null
  ) {
    command.FilterExpression = data.filterInfo.expression;
    for (const key of Object.keys(data.filterInfo.names)) {
      command.ExpressionAttributeNames[key] = data.filterInfo.names[key];
    }
    for (const key of Object.keys(data.filterInfo.values)) {
      command.ExpressionAttributeValues[key] = data.filterInfo.values[key];
    }
  }

  const response = await getDynamoDbClient(data.awsConfig).send(new QueryCommand(command));
  if (response?.Count != null && response.Count > 0 && response?.Items != null) {
    return response.Items;
  }
  return [];
}
export async function transactionalQueryies(awsConfig: IConfig, params: TransactWriteCommandInput): Promise<any> {
  return await getDynamoDbClient(awsConfig).send(new TransactWriteCommand(params));
}
export async function batchGetItem(
  awsConfig: IConfig,
  itemList: any,
  projections?: string[],
): Promise<Record<string, any>[]> {
  try {
    const params = {
      RequestItems: {
        [awsConfig.ddbTable]: {
          Keys: itemList,
          ProjectionExpression: projections == null ? 'id' : projections.join(', '),
        },
      },
    };
    const command = new BatchGetItemCommand(params);
    const response: BatchGetCommandOutput = await getDynamoDbClient(awsConfig).send(command);
    const items = response.Responses?.[awsConfig.ddbTable] || [];

    return items;
  } catch (error) {
    console.error('Error fetching items:', error);
    throw error;
  }
}
export async function batchWriteCommand(awsConfig: IConfig, tableName: string, itemList: any) {
  try {
    const params = {
      RequestItems: {
        [tableName]: itemList,
      },
    };
    let response;
    do {
      const command = new BatchWriteItemCommand(params);
      response = await getDynamoDbClient(awsConfig).send(command);

      // Retry unprocessed items
      const unprocessedItems = response.UnprocessedItems![tableName] || [];
      if (unprocessedItems.length > 0) {
        console.warn(`Retrying ${unprocessedItems.length} unprocessed items...`);
        params.RequestItems[tableName] = unprocessedItems;
        await new Promise((resolve) => setTimeout(resolve, 100)); // Small delay to prevent throttling
      }
    } while (response.UnprocessedItems && Object.keys(response.UnprocessedItems).length > 0);
  } catch (error) {
    console.error('Error writnig batch items:', error);
  }
}

export const doQuery = <T>(config: IConfig, command: QueryCommand): TE.TaskEither<Error, T[]> =>
  pipe(
    TE.tryCatch(
      () => getDynamoDbClient(config).send(command),
      (reason) => reason as Error,
    ),
    TE.map((output) => output.Items as T[]),
  );

export const doQueryEffect = <T>(config: IConfig, command: QueryCommand): Effect.Effect<T[], Error, never> =>
  Effect.tryPromise({
    try: async () => {
      const output = await getDynamoDbClient(config).send(command);
      return (output.Items as T[]) ?? [];
    },
    catch: (e) => e as Error,
  });

export const doGetEffect = <T>(config: IConfig, command: GetCommand): Effect.Effect<T | undefined, Error, never> =>
  Effect.tryPromise({
    try: async () => {
      const output = await getDynamoDbClient(config).send(command);
      return output.Item as T | undefined;
    },
    catch: (e) => e as Error,
  });

export const doGet = <T>(config: IConfig, command: GetCommand): TE.TaskEither<Error, T | undefined> =>
  pipe(
    TE.tryCatch(
      () => getDynamoDbClient(config).send(command),
      (reason) => reason as Error,
    ),
    TE.map((output) => output.Item as T),
  );

export const doDelete = (config: IConfig, pk: string, sortKey: string): TE.TaskEither<Error, string> =>
  pipe(
    TE.tryCatch(
      () =>
        getDynamoDbClient(config).send(
          new DeleteCommand({ TableName: config.ddbTable, Key: { _pk: pk, _sk: sortKey } }),
        ),
      (reason) => reason as Error,
    ),
    TE.map(() => pk),
  );

export const doCreate = <T extends Entity>(config: IConfig, document: T): TE.TaskEither<Error, string> =>
  pipe(
    TE.tryCatch(
      async () => await getDynamoDbClient(config).send(new PutCommand({ TableName: config.ddbTable, Item: document })),
      (reason) => reason as Error,
    ),
    TE.map(() => document.id!),
  );

export const doCreateEffect = <T extends Entity>(config: IConfig, document: T): Effect.Effect<string, Error> =>
  Effect.tryPromise({
    try: async () => {
      await getDynamoDbClient(config).send(
        new PutCommand({
          TableName: config.ddbTable,
          Item: document,
        }),
      );
      return document.id!;
    },
    catch: (reason) => reason as Error,
  });

export const doUpdate = (
  config: IConfig,
  id: string,
  sortKey: SortKey,
  document: Record<string, any>,
  fieldsToUpdate: string[],
): TE.TaskEither<Error, string> =>
  pipe(
    TE.tryCatch(
      async () => {
        const fields: string[] = [...fieldsToUpdate, 'updatedAt', 'updatedBy', 'updatedOn'];
        const names: Record<string, string> = {};
        const values: Record<string, any> = {};
        let updateExpression = 'SET ';
        for (const fieldName of fields) {
          updateExpression += `#${fieldName} = :${fieldName}, `;
          names[`#${fieldName}`] = fieldName;
          values[`:${fieldName}`] = document[fieldName];
        }
        if (updateExpression.endsWith(', ')) {
          updateExpression = updateExpression.substring(0, updateExpression.length - 2);
        }
        return await getDynamoDbClient(config).send(
          new UpdateCommand({
            TableName: config.ddbTable,
            Key: { _pk: id, _sk: sortKey },
            UpdateExpression: updateExpression,
            ExpressionAttributeNames: names,
            ExpressionAttributeValues: values,
          }),
        );
      },
      (reason) => reason as Error,
    ),
    TE.map(() => document.id!),
  );

export const doUpdateEffect = (
  config: IConfig,
  id: string,
  sortKey: SortKey,
  document: Record<string, any>,
  fieldsToUpdate: string[],
): Effect.Effect<string, Error, never> => {
  return Effect.tryPromise({
    try: async () => {
      const fields: string[] = [...fieldsToUpdate, 'updatedAt', 'updatedBy', 'updatedOn'];
      const names: Record<string, string> = {};
      const values: Record<string, any> = {};
      let updateExpression = 'SET ';

      for (const fieldName of fields) {
        updateExpression += `#${fieldName} = :${fieldName}, `;
        names[`#${fieldName}`] = fieldName;
        values[`:${fieldName}`] = document[fieldName];
      }

      if (updateExpression.endsWith(', ')) {
        updateExpression = updateExpression.slice(0, -2);
      }

      await getDynamoDbClient(config).send(
        new UpdateCommand({
          TableName: config.ddbTable,
          Key: { _pk: id, _sk: sortKey },
          UpdateExpression: updateExpression,
          ExpressionAttributeNames: names,
          ExpressionAttributeValues: values,
        }),
      );

      return document.id!;
    },
    catch: (error) => error as Error,
  });
};

export const doRemove = (
  config: IConfig,
  id: string,
  sortKey: SortKey,
  fieldsToRemove: string[],
): TE.TaskEither<Error, string> =>
  pipe(
    TE.tryCatch(
      async () => {
        return await getDynamoDbClient(config).send(
          new UpdateCommand({
            TableName: config.ddbTable,
            Key: { _pk: id, _sk: sortKey },
            UpdateExpression: `REMOVE ${fieldsToRemove.join(',')}`,
            ReturnValues: 'ALL_NEW',
          }),
        );
      },
      (reason) => reason as Error,
    ),
    TE.map(() => id!),
  );
export const doTransactWrite = (config: IConfig, document: TransactWriteCommandInput): TE.TaskEither<Error, void> =>
  pipe(
    TE.tryCatch(
      async () => await getDynamoDbClient(config).send(new TransactWriteCommand(document)),
      (reason) => reason as Error,
    ),
    TE.map(() => {}),
  );
