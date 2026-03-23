import { findByUser } from '@/lib/aws/dynamodb/mirror-reflection/background-image';
import * as TE from 'fp-ts/TaskEither';
import * as O from 'fp-ts/Option';
import { GetCommand } from '@aws-sdk/lib-dynamodb';
import { awsConfig, mockJwtAud } from '../../../../utils';

jest.mock('@/lib/aws/dynamodb', () => ({
  ...jest.requireActual('@/lib/aws/dynamodb'),
  doGet: jest.fn(),
}));

const mockedDoGet = require('@/lib/aws/dynamodb').doGet as jest.Mock;

describe('findByUser', () => {
  const config = awsConfig({ mirrorReflectionService: 'mirror-reflection-table' });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns Some(currentImage) when record exists', async () => {
    mockedDoGet.mockReturnValue(TE.right({ currentImage: 3 }));

    const result = await findByUser(config, mockJwtAud)();

    expect(result._tag).toBe('Right');
    if (result._tag === 'Right') {
      expect(O.isSome(result.right)).toBe(true);
      expect(result.right).toEqual(O.some(3));
    }

    expect(mockedDoGet).toHaveBeenCalledWith(config, expect.any(GetCommand));
  });

  it('returns None when record is not found', async () => {
    mockedDoGet.mockReturnValue(TE.right(null));

    const result = await findByUser(config, mockJwtAud)();

    expect(result._tag).toBe('Right');
    if (result._tag === 'Right') {
      expect(result.right).toEqual(O.none);
    }
  });

  it('returns Left on doGet error', async () => {
    const error = new Error('DynamoDB get failed');
    mockedDoGet.mockReturnValue(TE.left(error));

    const result = await findByUser(config, mockJwtAud)();

    expect(result._tag).toBe('Left');
    if (result._tag === 'Left') {
      expect(result.left).toBe(error);
    }
  });
});
