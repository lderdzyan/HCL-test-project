import { findByUserAllInfo } from '@/lib/aws/dynamodb/mirror-reflection/background-image';
import { GetCommand } from '@aws-sdk/lib-dynamodb';
import * as TE from 'fp-ts/TaskEither';
import * as O from 'fp-ts/Option';

import { awsConfig, mockId, mockJwtAud } from '../../../../utils';

jest.mock('@/lib/aws/dynamodb', () => ({
  ...jest.requireActual('@/lib/aws/dynamodb'),
  doGet: jest.fn(),
}));

const mockedDoGet = require('@/lib/aws/dynamodb').doGet as jest.Mock;

describe('findByUserAllInfo', () => {
  const config = awsConfig({ mirrorReflectionService: 'mirror-reflection-table' });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns Some(backgroundImageDetails) when record exists', async () => {
    const backgroundImageDetails = {
      id: mockId,
      currentImage: 4,
      createdAt: 1710000000000,
      updatedAt: 1710001000000,
      createdBy: mockJwtAud,
      updatedBy: mockJwtAud,
    };

    mockedDoGet.mockReturnValue(TE.right(backgroundImageDetails));

    const result = await findByUserAllInfo(config, mockJwtAud)();

    expect(result._tag).toBe('Right');
    if (result._tag === 'Right') {
      expect(result.right).toEqual(O.some(backgroundImageDetails));
    }

    expect(mockedDoGet).toHaveBeenCalledWith(config, expect.any(GetCommand));
  });

  it('returns None when record not found', async () => {
    mockedDoGet.mockReturnValue(TE.right(null));

    const result = await findByUserAllInfo(config, mockJwtAud)();

    expect(result._tag).toBe('Right');
    if (result._tag === 'Right') {
      expect(result.right).toEqual(O.none);
    }
  });

  it('returns Left on doGet error', async () => {
    const error = new Error('DynamoDB error');

    mockedDoGet.mockReturnValue(TE.left(error));

    const result = await findByUserAllInfo(config, mockJwtAud)();

    expect(result._tag).toBe('Left');
    if (result._tag === 'Left') {
      expect(result.left).toBe(error);
    }
  });
});
