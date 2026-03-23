import { Context } from 'hono';

export const generatedId = 'generated-id';
export const generatedCreatedAt = 1234567890;
export const generatedCreatedOn = '2025-06-06';

export const awsConfig = (ddbTables: { [key: string]: string }) =>
  ({
    ddbTables: ddbTables,
    ddbTable: '',
    region: 'us-east-1',
    uploadBucket: '',
    eventBridgeArn: '',
    credentials: {
      accessKeyId: '',
      secretAccessKey: '',
    },
    stsConfig: {} as any,
    pageTrackingTtl: 60,
  }) as any;

export interface ValidationErrorTest {
  hasError: () => boolean;
  addField: jest.Mock;
}

export const mockJwtAud = 'user-123';
export const mockId = 'id-123';
export const mockParams = { id: mockId };

export const createMockContext = (body: any, aud = mockJwtAud, params: Record<string, string> = {}): Context =>
  ({
    json: jest.fn().mockImplementation((body, status) => ({ body, status })),
    req: {
      param: jest.fn().mockImplementation((key: string) => params[key]),
    },
    var: {
      jwtPayload: { aud },
      body,
    },
  }) as unknown as Context;

export const getDateRangeInMs = (dto: { startOfDate: string; endOfDate: string }) => ({
  startOfDateTime: new Date(dto.startOfDate).getTime(),
  endOfDateTime: new Date(dto.endOfDate).getTime(),
});

export const buildValidationErrorMock = (): ValidationErrorTest => ({
  hasError: () => true,
  addField: jest.fn(),
});

export const buildValidationSuccessMock = (): ValidationErrorTest => ({
  hasError: () => false,
  addField: jest.fn(),
});
