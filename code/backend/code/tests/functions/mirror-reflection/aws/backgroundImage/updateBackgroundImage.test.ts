import { updateBackgroundImage } from '@/lib/aws/dynamodb/mirror-reflection/background-image';
import * as TE from 'fp-ts/TaskEither';
import { awsConfig, mockJwtAud, generatedCreatedAt, generatedCreatedOn } from '../../../../utils';
import { SortKey } from '@/lib/aws/dynamodb';

jest.mock('@/lib/aws/dynamodb', () => ({
  ...jest.requireActual('@/lib/aws/dynamodb'),
  doUpdate: jest.fn(),
}));

jest.mock('@/lib/entity', () => ({
  currentAt: () => generatedCreatedAt,
  currentOn: () => generatedCreatedOn,
}));

const mockedDoUpdate = require('@/lib/aws/dynamodb').doUpdate as jest.Mock;

describe('updateBackgroundImage', () => {
  const config = awsConfig({ mirrorReflectionService: 'mirror-reflection-table' });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('increments currentImage and calls doUpdate', async () => {
    const bgImage = {
      id: mockJwtAud,
      currentImage: 3,
      createdAt: 1710000000000,
      createdOn: '2024-06-01',
      createdBy: mockJwtAud,
      pid: mockJwtAud,
      updatedAt: generatedCreatedAt,
      updatedOn: generatedCreatedOn,
    };

    mockedDoUpdate.mockReturnValue(TE.right(mockJwtAud));

    const result = await updateBackgroundImage(config, bgImage, mockJwtAud)();

    expect(result._tag).toBe('Right');
    if (result._tag === 'Right') {
      expect(result.right).toBe(mockJwtAud);
    }

    expect(mockedDoUpdate).toHaveBeenCalledWith(
      { ...config, ddbTable: 'mirror-reflection-table' },
      mockJwtAud,
      SortKey.MirrorReflectionBackgroundImage,
      expect.objectContaining({
        id: mockJwtAud,
        currentImage: 4,
        updatedBy: mockJwtAud,
        updatedAt: generatedCreatedAt,
        updatedOn: generatedCreatedOn,
      }),
      ['currentImage'],
    );
  });

  it('wraps around currentImage to 1 if >= 5', async () => {
    const bgImage = {
      id: mockJwtAud,
      currentImage: 5,
      createdAt: 1710000000000,
      createdOn: '2024-06-01',
      createdBy: mockJwtAud,
      updatedAt: generatedCreatedAt,
      updatedOn: generatedCreatedOn,
      pid: mockJwtAud,
    };

    mockedDoUpdate.mockReturnValue(TE.right(mockJwtAud));

    const result = await updateBackgroundImage(config, bgImage, mockJwtAud)();

    expect(result._tag).toBe('Right');
    if (result._tag === 'Right') {
      expect(result.right).toBe(mockJwtAud);
    }

    expect(mockedDoUpdate.mock.calls[0][3].currentImage).toBe(1);
  });

  it('returns Left on update failure', async () => {
    const error = new Error('Update failed');
    mockedDoUpdate.mockReturnValue(TE.left(error));

    const bgImage = {
      id: mockJwtAud,
      currentImage: 2,
      createdAt: 1710000000000,
      createdOn: '2024-06-01',
      createdBy: mockJwtAud,
      pid: mockJwtAud,
    };

    const result = await updateBackgroundImage(config, bgImage, mockJwtAud)();

    expect(result._tag).toBe('Left');
    if (result._tag === 'Left') {
      expect(result.left.message).toBe(`Error on update background image: ${error.message}`);
    }
  });
});
