import { awsConfig, generatedCreatedAt, generatedCreatedOn, generatedId, mockId, mockJwtAud } from '../../../../utils';

jest.mock('@paralleldrive/cuid2', () => ({
  createId: () => generatedId,
}));

jest.mock('@/lib/entity', () => ({
  currentAt: () => generatedCreatedAt,
  currentOn: () => generatedCreatedOn,
}));

jest.mock('@/lib/aws/dynamodb', () => ({
  ...jest.requireActual('@/lib/aws/dynamodb'),
  doCreate: jest.fn(),
}));

import { createCustomFeelings } from '@/lib/aws/dynamodb/mirror-reflection/custom-feeling';
import { SortKey } from '@/lib/aws/dynamodb';
import { CustomFeelingType } from '@/lib/entities/mirror-reflection/mirror-reflection';
import { CustomFeeling } from '@/lib/entities/mirror-reflection/custom-feeling';
import * as TE from 'fp-ts/TaskEither';
import { isLeft } from 'fp-ts/Either';

const doCreate = require('@/lib/aws/dynamodb').doCreate as jest.Mock;

describe('createCustomFeelings', () => {
  const config = awsConfig({ mirrorReflectionService: 'feelings-table' });

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  it('adds id and metadata and calls doCreate', async () => {
    const feelingWords = { type: CustomFeelingType.upFeeling, text: ['Happy'] } as CustomFeeling;
    doCreate.mockReturnValue(TE.right('ok'));

    const result = await createCustomFeelings(config, feelingWords, mockJwtAud)();

    expect(result._tag).toBe('Right');
    expect(doCreate).toHaveBeenCalledWith(
      { ...config, ddbTable: 'feelings-table' },
      expect.objectContaining({
        _pk: generatedId,
        _sk: SortKey.CustomFeeling,
        attr1: mockJwtAud,
        attr2: CustomFeelingType.upFeeling,
        attr4: generatedCreatedAt,
        id: generatedId,
        createdBy: mockJwtAud,
        createdAt: generatedCreatedAt,
        createdOn: generatedCreatedOn,
        updatedBy: mockJwtAud,
        updatedAt: generatedCreatedAt,
        updatedOn: generatedCreatedOn,
      }),
    );
  });

  it('does not overwrite existing id', async () => {
    const feelingWords = { id: mockId, type: CustomFeelingType.upFeeling, text: ['Happy'] } as CustomFeeling;

    doCreate.mockReturnValue(TE.right('success'));
    await createCustomFeelings(config, feelingWords, mockJwtAud)();

    expect(doCreate).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ _pk: mockId }));
  });

  it('propagates error from doCreate', async () => {
    const feelingWords = { type: CustomFeelingType.upFeeling, text: ['Happy'] } as CustomFeeling;
    const error = new Error('DB failure');
    doCreate.mockReturnValue(TE.left(error));

    const result = await createCustomFeelings(config, feelingWords, mockJwtAud)();

    expect(isLeft(result)).toBe(true);
    if (isLeft(result)) {
      expect(result.left).toBe(error);
    }
  });

  it('sets createdBy and updatedBy correctly', async () => {
    const feelingWords = { id: mockId, type: CustomFeelingType.upFeeling, text: ['Happy'] } as CustomFeeling;
    doCreate.mockReturnValue(TE.right('success'));

    await createCustomFeelings(config, feelingWords, mockJwtAud)();

    expect(feelingWords.createdBy).toBe(mockJwtAud);
    expect(feelingWords.updatedBy).toBe(mockJwtAud);
    expect(feelingWords.createdAt).toBeDefined();
    expect(feelingWords.updatedAt).toBeDefined();
  });
});
