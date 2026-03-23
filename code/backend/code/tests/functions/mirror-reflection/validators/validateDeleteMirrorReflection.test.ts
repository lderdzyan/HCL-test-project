import * as E from 'fp-ts/Either';
import * as TE from 'fp-ts/TaskEither';

import * as O from 'fp-ts/Option';
import { validateDeleteMirrorReflection } from '@/functions/mirror-reflection/validators/deleteMIrrorReflection';
import { getMirrorReflectionById } from '@/lib/entities/mirror-reflection/mirror-reflection';
import { ValidationError } from '@/lib/errors';

import { mockJwtAud } from '../../../utils';
import { mrId, validMRItem } from '../../../utils/mirror-reflection/data';

jest.mock('@/lib/entities/mirror-reflection/mirror-reflection');

describe('validateDeleteMirrorReflection', () => {
  const mockedGetMirrorReflectionById = getMirrorReflectionById as jest.MockedFunction<typeof getMirrorReflectionById>;

  const runValidation = async (id: string, pid: string): Promise<ValidationError> => {
    const result = await validateDeleteMirrorReflection(id, pid)();
    if (E.isRight(result)) {
      return result.right;
    }
    throw new Error('Unexpected Left from TaskEither');
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test.each([
    {
      id: '',
      pid: mockJwtAud,
      mockMirror: O.none,
      expectedError: 'Required',
      description: 'empty id',
    },
    {
      id: mrId,
      pid: mockJwtAud,
      mockMirror: O.none,
      expectedError: 'Mirror Reflection not exists.',
      description: 'mirror reflection not found',
    },
    {
      id: mrId,
      pid: mockJwtAud,
      mockMirror: O.some({ ...validMRItem, pid: 'different-pid' }),
      expectedError: 'Mirror Reflection not exists.',
      description: 'pid does not match',
    },
  ])('returns error when $description', async ({ id, pid, mockMirror, expectedError }) => {
    mockedGetMirrorReflectionById.mockReturnValueOnce(TE.right(mockMirror));

    const error = await runValidation(id, pid);

    expect(error.hasError()).toBe(true);
    const fieldError = error.getFields().find((f) => f.key === 'id');
    expect(fieldError).toBeDefined();
    expect(fieldError?.error).toBe(expectedError);
  });

  it('returns error when getMirrorReflectionById returns an error', async () => {
    mockedGetMirrorReflectionById.mockReturnValueOnce(TE.left(new Error('DB error')));

    const error = await runValidation(mrId, mockJwtAud);

    expect(error.hasError()).toBe(true);
    const fieldError = error.getFields().find((f) => f.key === 'id');
    expect(fieldError).toBeDefined();
    expect(fieldError?.error).toBe('Mirror Reflection not exists.');
  });

  it('returns no errors when id and pid are valid', async () => {
    mockedGetMirrorReflectionById.mockReturnValueOnce(TE.right(O.some(validMRItem)));

    const error = await runValidation(mrId, mockJwtAud);

    expect(error.hasError()).toBe(false);
    expect(error.getFields()).toHaveLength(0);
  });
});
