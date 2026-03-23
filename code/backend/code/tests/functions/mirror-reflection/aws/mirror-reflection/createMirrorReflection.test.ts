import { awsConfig, generatedId, generatedCreatedAt, generatedCreatedOn, mockJwtAud } from '../../../../utils';

jest.mock('@paralleldrive/cuid2', () => ({
  createId: () => generatedId,
}));

jest.mock('@/lib/entity', () => ({
  currentAt: jest.fn(() => generatedCreatedAt),
  currentOn: jest.fn(() => generatedCreatedOn),
}));

jest.mock('@/lib/aws/dynamodb', () => ({
  ...jest.requireActual('@/lib/aws/dynamodb'),
  doCreate: jest.fn(),
}));

import { createMirrorReflection } from '@/lib/aws/dynamodb/mirror-reflection/mirror-reflection';
import { SortKey } from '@/lib/aws/dynamodb';
import * as TE from 'fp-ts/TaskEither';
import { validMRAnswer } from '../../../../utils/mirror-reflection/data';

const mockedDoCreate = require('@/lib/aws/dynamodb').doCreate as jest.Mock;

describe('createMirrorReflection', () => {
  const config = awsConfig({ mirrorReflectionService: 'mirror-reflection-table' });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates mirror reflection with generated id and calls doCreate', async () => {
    mockedDoCreate.mockReturnValue(TE.right('ok'));

    const result = await createMirrorReflection(config, validMRAnswer, mockJwtAud)();

    expect(result._tag).toBe('Right');

    expect(mockedDoCreate).toHaveBeenCalledWith(
      { ...config, ddbTable: 'mirror-reflection-table' },
      expect.objectContaining({
        _pk: generatedId,
        _sk: SortKey.MirrorReflection,
        id: generatedId,
        pid: mockJwtAud,
        attr1: mockJwtAud,
        attr4: generatedCreatedAt,
        createdBy: mockJwtAud,
        createdAt: generatedCreatedAt,
        createdOn: generatedCreatedOn,
        updatedBy: mockJwtAud,
        updatedAt: generatedCreatedAt,
        updatedOn: generatedCreatedOn,
        answers: JSON.stringify(validMRAnswer.answers),
      }),
    );
  });

  it('uses provided id if exists', async () => {
    mockedDoCreate.mockReturnValue(TE.right('ok'));

    const mirrorReflectionWithId = {
      ...validMRAnswer,
      id: 'existing-id',
    };

    await createMirrorReflection(config, mirrorReflectionWithId, mockJwtAud)();

    expect(mockedDoCreate).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        id: 'existing-id',
        _pk: 'existing-id',
      }),
    );
  });

  it('uses startedAt as createdAt if provided', async () => {
    const startedAt = 999999999;
    const withStartedAt = { ...validMRAnswer, startedAt, createdOn: generatedCreatedOn };

    mockedDoCreate.mockReturnValue(TE.right('ok'));

    await createMirrorReflection(config, withStartedAt, mockJwtAud)();

    const [, payload] = mockedDoCreate.mock.calls[0];

    expect(payload.createdAt).toBe(startedAt);
  });

  it('uses currentAt if startedAt not provided', async () => {
    const withoutStartedAt = { ...validMRAnswer, createdOn: generatedCreatedOn };
    delete withoutStartedAt.startedAt;

    mockedDoCreate.mockReturnValue(TE.right('ok'));

    await createMirrorReflection(config, withoutStartedAt, mockJwtAud)();

    const [, payload] = mockedDoCreate.mock.calls[0];

    expect(payload.createdAt).toBe(generatedCreatedAt);
  });

  it('returns Left if doCreate fails', async () => {
    const error = new Error('DDB failure');
    mockedDoCreate.mockReturnValue(TE.left(error));

    const result = await createMirrorReflection(config, validMRAnswer, mockJwtAud)();

    expect(result._tag).toBe('Left');
    if (result._tag === 'Left') {
      expect(result.left).toBe(error);
    }
  });
});
