import { DynamoDBDocumentClient, GetCommand, PutCommand, DeleteCommand, GetCommandOutput } from '@aws-sdk/lib-dynamodb';
import { mockClient } from 'aws-sdk-client-mock';

export const createGetCommandOutput = (item?: Record<string, any>): GetCommandOutput => ({
  Item: item,
  $metadata: {},
});

export const setupDynamoMock = () => {
  const docClientMock = mockClient(DynamoDBDocumentClient as any);

  const resetMock = () => docClientMock.reset();

  const mockGetCommand = (item?: Record<string, any>) => {
    docClientMock.on(GetCommand as any).resolves(createGetCommandOutput(item));
  };

  const mockGetCommandNoItem = () => {
    docClientMock.on(GetCommand as any).resolves({ $metadata: {} });
  };

  const mockPutCommand = () => {
    docClientMock.on(PutCommand as any).resolves({ $metadata: {} });
  };

  const mockDeleteCommand = () => {
    docClientMock.on(DeleteCommand as any).resolves({ $metadata: {} });
  };

  return {
    docClientMock,
    resetMock,
    mockGetCommand,
    mockGetCommandNoItem,
    mockPutCommand,
    mockDeleteCommand,
  };
};
