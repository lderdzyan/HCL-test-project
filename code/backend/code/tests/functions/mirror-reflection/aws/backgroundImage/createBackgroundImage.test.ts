import { createBackgroundImage } from '@/lib/aws/dynamodb/mirror-reflection/background-image';
import * as TE from 'fp-ts/TaskEither';

import { awsConfig, generatedCreatedAt, generatedCreatedOn, mockJwtAud } from '../../../../utils';
import { SortKey } from '@/lib/aws/dynamodb';

jest.mock('@/lib/aws/dynamodb', () => ({
  ...jest.requireActual('@/lib/aws/dynamodb'),
  doCreate: jest.fn(),
}));

jest.mock('@/lib/entity', () => ({
  currentAt: () => generatedCreatedAt,
  currentOn: () => generatedCreatedOn,
}));

const mockedDoCreate = require('@/lib/aws/dynamodb').doCreate as jest.Mock;

describe('createBackgroundImage', () => {
  const config = awsConfig({ mirrorReflectionService: 'mirror-reflection-table' });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates background image with correct attributes', async () => {
    mockedDoCreate.mockReturnValue(TE.right(mockJwtAud));

    const result = await createBackgroundImage(config, mockJwtAud)();

    expect(result._tag).toBe('Right');
    if (result._tag === 'Right') {
      expect(result.right).toBe(mockJwtAud);
    }

    expect(mockedDoCreate).toHaveBeenCalledWith(
      { ...config, ddbTable: 'mirror-reflection-table' },
      {
        _pk: mockJwtAud,
        _sk: SortKey.MirrorReflectionBackgroundImage,
        attr1: mockJwtAud,
        attr4: generatedCreatedAt,
        id: mockJwtAud,
        createdAt: generatedCreatedAt,
        createdOn: generatedCreatedOn,
        updatedBy: mockJwtAud,
        updatedAt: generatedCreatedAt,
        updatedOn: generatedCreatedOn,
        currentImage: 1,
      },
    );
  });

  it('returns Left with custom error on failure', async () => {
    const error = new Error('DynamoDB create failed');
    mockedDoCreate.mockReturnValue(TE.left(error));

    const result = await createBackgroundImage(config, mockJwtAud)();

    expect(result._tag).toBe('Left');
    if (result._tag === 'Left') {
      expect(result.left.message).toBe(`Error on create background image: ${error.message}`);
    }
  });
});
