import { createDeletedMirrorReflection } from '@/lib/aws/dynamodb/mirror-reflection/mirror-reflection';
import { DeletedSortKey } from '@/lib/aws/dynamodb';
import * as TE from 'fp-ts/TaskEither';

import { awsConfig } from '../../../../utils';
import { validMRItem } from '../../../../utils/mirror-reflection/data';

jest.mock('@/lib/aws/dynamodb', () => ({
  ...jest.requireActual('@/lib/aws/dynamodb'),
  doCreate: jest.fn(),
}));

const mockedDoCreate = require('@/lib/aws/dynamodb').doCreate as jest.Mock;

describe('createDeletedMirrorReflection', () => {
  const config = awsConfig({ mirrorReflectionService: 'mirror-reflection-table' });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls doCreate with transformed mirrorReflection and returns Right', async () => {
    mockedDoCreate.mockReturnValue(TE.right('ok'));

    const result = await createDeletedMirrorReflection(config, validMRItem)();

    expect(result._tag).toBe('Right');

    expect(mockedDoCreate).toHaveBeenCalledWith(
      { ...config, ddbTable: 'mirror-reflection-table' },
      expect.objectContaining({
        _sk: DeletedSortKey.MirrorReflection,
        attr1: validMRItem.pid,
        attr4: validMRItem.createdAt,
        id: validMRItem.id,
      }),
    );
  });

  it('returns Left with error if doCreate fails', async () => {
    const error = new Error('DynamoDB failure');
    mockedDoCreate.mockReturnValue(TE.left(error));

    const result = await createDeletedMirrorReflection(config, validMRItem)();

    expect(result._tag).toBe('Left');
    if (result._tag === 'Left') {
      expect(result.left.message).toContain('CreateDeletedMirrorReflection failed');
      expect(result.left.message).toContain('DynamoDB failure');
    }
  });
});
