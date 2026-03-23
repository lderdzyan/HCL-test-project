import { deleteMirrorReflectionById } from '@/functions/mirror-reflection/handlers/deleteMirrorReflectionById';
import * as validator from '@/functions/mirror-reflection/validators/deleteMIrrorReflection';
import * as controllerModule from '@/lib/controllers/mirror-reflection/mirror-reflection';
import * as TE from 'fp-ts/TaskEither';

import {
  createMockContext,
  mockId,
  mockJwtAud,
  buildValidationErrorMock,
  buildValidationSuccessMock,
} from '../../../utils';

jest.mock('@/functions/mirror-reflection/validators/deleteMIrrorReflection');
jest.mock('@/lib/controllers/mirror-reflection/mirror-reflection');

describe('deleteMirrorReflectionById', () => {
  const mockValidate = validator.validateDeleteMirrorReflection as jest.Mock;
  const mockDelete = controllerModule.MirrorReflectionController.deleteMirrorReflection as jest.Mock;

  let ctx: ReturnType<typeof createMockContext>;

  beforeEach(() => {
    jest.clearAllMocks();
    ctx = createMockContext({}, mockJwtAud, { id: mockId });
  });

  describe('validation phase', () => {
    it('returns 400 if validation returns error (Right with hasError=true)', async () => {
      const validationError = buildValidationErrorMock();
      mockValidate.mockReturnValue(TE.right(validationError));

      const result = await deleteMirrorReflectionById(ctx);

      expect(mockValidate).toHaveBeenCalledWith(mockId, mockJwtAud);
      expect(mockDelete).not.toHaveBeenCalled();

      expect(ctx.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            hasError: expect.any(Function),
          }),
        }),
        400,
      );
      expect(result.status).toBe(400);
    });

    it('returns 400 if validation fails (Left)', async () => {
      const validationFailure = new Error('Validation threw error');
      mockValidate.mockReturnValue(TE.left(validationFailure));

      const result = await deleteMirrorReflectionById(ctx);

      expect(mockValidate).toHaveBeenCalledWith(mockId, mockJwtAud);
      expect(mockDelete).not.toHaveBeenCalled();

      expect(ctx.json).toHaveBeenCalledWith({ error: validationFailure }, 400);
      expect(result.status).toBe(400);
    });
  });

  describe('deletion phase', () => {
    it('returns 200 if validation passes and deletion succeeds', async () => {
      mockValidate.mockReturnValue(TE.right(buildValidationSuccessMock()));
      mockDelete.mockReturnValue(TE.of(mockId));

      const result = await deleteMirrorReflectionById(ctx);

      expect(mockValidate).toHaveBeenCalledWith(mockId, mockJwtAud);
      expect(mockDelete).toHaveBeenCalledWith(mockId);

      expect(ctx.json).toHaveBeenCalledWith({ id: mockId }, 200);
      expect(result.status).toBe(200);
    });

    it('returns 400 if deletion fails (Left)', async () => {
      const deleteError = new Error('DB failure');
      mockValidate.mockReturnValue(TE.right(buildValidationSuccessMock()));
      mockDelete.mockReturnValue(TE.left(deleteError));

      const result = await deleteMirrorReflectionById(ctx);

      expect(mockValidate).toHaveBeenCalledWith(mockId, mockJwtAud);
      expect(mockDelete).toHaveBeenCalledWith(mockId);

      expect(ctx.json).toHaveBeenCalledWith({ error: deleteError }, 400);
      expect(result.status).toBe(400);
    });
  });
});
