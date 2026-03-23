import { findByUser } from '@/lib/aws/dynamodb/mirror-reflection/custom-feeling';
import * as TE from 'fp-ts/TaskEither';
import * as O from 'fp-ts/Option';

import { awsConfig, mockJwtAud } from '../../../../utils';
import { CustomFeelingType } from '@/lib/entities/mirror-reflection/mirror-reflection';

jest.mock('@/lib/aws/dynamodb', () => ({
  ...jest.requireActual('@/lib/aws/dynamodb'),
  doQuery: jest.fn(),
}));

const mockedDoQuery = require('@/lib/aws/dynamodb').doQuery as jest.Mock;

describe('findByUser', () => {
  const config = awsConfig({ mirrorReflectionService: 'feelings-table' });

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  it('returns Some with mapped customFeelings when results exist', async () => {
    const mockResults = [
      { id: 'id-1', type: CustomFeelingType.upFeeling, text: ['Happy'] },
      { id: 'id-2', type: CustomFeelingType.downFeeling, text: ['Relieved', 'Nervous'] },
    ];

    mockedDoQuery.mockReturnValue(TE.right(mockResults));

    const result = await findByUser(config, mockJwtAud)();

    expect(result._tag).toBe('Right');
    if (result._tag === 'Right') {
      expect(O.isSome(result.right)).toBe(true);
      expect(result.right).toEqual(O.some(mockResults));
    }
  });

  it('returns None when no results found', async () => {
    mockedDoQuery.mockReturnValue(TE.right([]));

    const result = await findByUser(config, mockJwtAud)();

    expect(result._tag).toBe('Right');
    if (result._tag === 'Right') {
      expect(result.right).toEqual(O.none);
    }
  });

  it('returns Left when query fails', async () => {
    const error = new Error('Query failed');
    mockedDoQuery.mockReturnValue(TE.left(error));

    const result = await findByUser(config, mockJwtAud)();

    expect(result._tag).toBe('Left');
    if (result._tag === 'Left') {
      expect(result.left).toBe(error);
    }
  });
});
