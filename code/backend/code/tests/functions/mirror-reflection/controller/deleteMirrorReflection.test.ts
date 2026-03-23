import * as TE from 'fp-ts/TaskEither';
import * as O from 'fp-ts/Option';
import {
  createDeletedMirrorReflection,
  deleteMirrorReflection as deleteMirrorReflectionEntity,
  getMirrorReflectionById,
} from '@/lib/entities/mirror-reflection/mirror-reflection';
import { MirrorReflectionController } from '@/lib/controllers/mirror-reflection/mirror-reflection';
import { mrId, validMRItem } from '../../../utils/mirror-reflection/data';

jest.mock('@/lib/entities/mirror-reflection/mirror-reflection', () => ({
  getMirrorReflectionById: jest.fn(),
  createDeletedMirrorReflection: jest.fn(),
  deleteMirrorReflection: jest.fn(),
}));

const mockedGetMirrorReflectionById = getMirrorReflectionById as jest.Mock;
const mockedCreateDeletedMirrorReflection = createDeletedMirrorReflection as jest.Mock;
const mockedDeleteMirrorReflectionEntity = deleteMirrorReflectionEntity as jest.Mock;

describe('deleteMirrorReflection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should succeed immediately if mirror reflection is not found', async () => {
    mockedGetMirrorReflectionById.mockReturnValueOnce(TE.right(O.none));

    const result = await MirrorReflectionController.deleteMirrorReflection(mrId)();

    expect(result._tag).toBe('Right');
    expect(result).toEqual({ _tag: 'Right', right: undefined });

    expect(mockedGetMirrorReflectionById).toHaveBeenCalledWith(mrId);
    expect(mockedCreateDeletedMirrorReflection).not.toHaveBeenCalled();
    expect(mockedDeleteMirrorReflectionEntity).not.toHaveBeenCalled();
  });

  it('should create deleted reflection and delete real one if found', async () => {
    mockedGetMirrorReflectionById.mockReturnValueOnce(TE.right(O.some(validMRItem)));
    mockedCreateDeletedMirrorReflection.mockReturnValueOnce(TE.right('success'));
    mockedDeleteMirrorReflectionEntity.mockReturnValueOnce(TE.right(undefined));

    const result = await MirrorReflectionController.deleteMirrorReflection(mrId)();

    expect(result._tag).toBe('Right');
    expect(result).toEqual({ _tag: 'Right', right: undefined });

    expect(mockedGetMirrorReflectionById).toHaveBeenCalledWith(mrId);
    expect(mockedCreateDeletedMirrorReflection).toHaveBeenCalledWith(validMRItem);
    expect(mockedDeleteMirrorReflectionEntity).toHaveBeenCalledWith(mrId);
  });

  it('should return Left if getMirrorReflectionById fails', async () => {
    const error = new Error('Fetch failed');
    mockedGetMirrorReflectionById.mockReturnValueOnce(TE.left(error));

    const result = await MirrorReflectionController.deleteMirrorReflection(mrId)();

    expect(result._tag).toBe('Left');
    if (result._tag === 'Left') {
      expect(result.left).toBe(error);
    }
  });

  it('should return Left if createDeletedMirrorReflection fails', async () => {
    mockedGetMirrorReflectionById.mockReturnValueOnce(TE.right(O.some(validMRItem)));
    const error = new Error('Create failed');
    mockedCreateDeletedMirrorReflection.mockReturnValueOnce(TE.left(error));

    const result = await MirrorReflectionController.deleteMirrorReflection(mrId)();

    expect(result._tag).toBe('Left');
    if (result._tag === 'Left') {
      expect(result.left).toBe(error);
    }

    expect(mockedDeleteMirrorReflectionEntity).not.toHaveBeenCalled();
  });

  it('should return Left if deleteMirrorReflection fails', async () => {
    mockedGetMirrorReflectionById.mockReturnValueOnce(TE.right(O.some(validMRItem)));
    mockedCreateDeletedMirrorReflection.mockReturnValueOnce(TE.right('success'));
    const error = new Error('Delete failed');
    mockedDeleteMirrorReflectionEntity.mockReturnValueOnce(TE.left(error));

    const result = await MirrorReflectionController.deleteMirrorReflection(mrId)();

    expect(result._tag).toBe('Left');
    if (result._tag === 'Left') {
      expect(result.left).toBe(error);
    }
  });
});
