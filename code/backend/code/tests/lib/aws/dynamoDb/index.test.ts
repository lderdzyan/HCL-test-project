import {
  getDynamoDbClient,
  findByPartitionKey,
  createDocument,
  deleteByPartitionKey,
  SortKey,
} from '@/lib/aws/dynamodb/index';
import { setupDynamoMock } from '../../../utils/mockDynamo';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

const mockConfig = {
  region: 'us-east-1',
  ddbTable: 'myTable',
  ddbTables: {
    main: 'myTable',
    tracking: 'tracking',
    eventTracking: 'eventTracking',
    scheduling: 'string',
    promoService: 'string',
    mirrorReflectionService: 'mr-table',
  },
  uploadBucket: 'uploadBucket',
  eventBridgeArn: 'eventBridgeArn',
  credentials: {
    accessKeyId: 'access-key',
    secretAccessKey: 'secret-key',
  },
  stsConfig: {
    uploadRoleArn: 'uploadRoleArn',
  },
  pageTrackingTtl: 7,
};

const { docClientMock, resetMock, mockGetCommand, mockGetCommandNoItem, mockPutCommand, mockDeleteCommand } =
  setupDynamoMock();

describe('getDynamoDbClient', () => {
  it('returns a DynamoDBDocumentClient with credentials', () => {
    const client = getDynamoDbClient(mockConfig);
    expect(client).toBeInstanceOf(DynamoDBDocumentClient);
  });

  it('returns client when credentials are empty strings', () => {
    const emptyCredsConfig = {
      ...mockConfig,
      credentials: {
        accessKeyId: '',
        secretAccessKey: '',
      },
    };
    const client = getDynamoDbClient(emptyCredsConfig);
    expect(client).toBeInstanceOf(DynamoDBDocumentClient);
  });
});

describe('findByPartitionKey', () => {
  beforeEach(() => resetMock());

  it('should return item from DynamoDB', async () => {
    const expectedItem = {
      _pk: 'user#123',
      _sk: SortKey.Application,
      data: 'test',
    };

    mockGetCommand(expectedItem);

    const item = await findByPartitionKey(mockConfig, 'user#123', SortKey.Application);
    expect(item).toEqual(expectedItem);

    const input = docClientMock.calls()[0].args[0].input;
    expect(input).toMatchObject({
      TableName: mockConfig.ddbTable,
      Key: { _pk: 'user#123', _sk: SortKey.Application },
      ConsistentRead: true,
    });
  });

  it('should return undefined when no item found', async () => {
    mockGetCommandNoItem();

    const item = await findByPartitionKey(mockConfig, 'user#999', SortKey.MfaProfile);
    expect(item).toBeUndefined();
  });
});

describe('createDocument', () => {
  beforeEach(() => resetMock());

  it('should call PutCommand with correct parameters', async () => {
    const document = { _pk: 'item#1', _sk: SortKey.Application, data: 'value' };
    mockPutCommand();

    await createDocument(mockConfig, document);

    const input = docClientMock.calls()[0].args[0].input;
    expect(input).toEqual({
      TableName: mockConfig.ddbTable,
      Item: document,
    });
  });
});

describe('deleteByPartitionKey', () => {
  beforeEach(() => resetMock());

  it('should call DeleteCommand with correct key', async () => {
    mockDeleteCommand();

    await deleteByPartitionKey(mockConfig, 'item#1', SortKey.MfaProfile);

    const input = docClientMock.calls()[0].args[0].input;
    expect(input).toEqual({
      TableName: mockConfig.ddbTable,
      Key: {
        _pk: 'item#1',
        _sk: SortKey.MfaProfile,
      },
    });
  });
});
