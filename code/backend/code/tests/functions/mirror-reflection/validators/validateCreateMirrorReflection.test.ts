import { isRight } from 'fp-ts/Either';
import { validateCreateMirrorReflection } from '@/functions/mirror-reflection/validators/createMirrorReflection';
import { badMRAnswer, validMRAnswer } from '../../../utils/mirror-reflection/data';
import { ValidationError } from '@/lib/errors';

describe('validateCreateMirrorReflection with JSON answers', () => {
  const runValidation = async (input: any): Promise<ValidationError> => {
    const clone = structuredClone(input);
    if (typeof clone.answers === 'string') {
      clone.answers = JSON.parse(clone.answers);
    }
    const either = await validateCreateMirrorReflection(clone)();

    if (isRight(either)) {
      return either.right;
    }

    throw new Error('Unexpected Left');
  };

  it('should pass validation for valid input', async () => {
    const error = await runValidation(validMRAnswer);
    expect(error.getFields()).toHaveLength(0);
  });

  it('should return error if name is empty', async () => {
    const input = {
      ...validMRAnswer,
      name: ' ',
    };
    const error = await runValidation(input);
    expect(error.getFields()).toContainEqual({ key: 'name', error: 'Required' });
  });

  it('should return error if answers is empty JSON object', async () => {
    const input = {
      ...validMRAnswer,
      answers: JSON.stringify({}),
    };
    const error = await runValidation(input);
    expect(error.getFields()).toContainEqual({ key: 'answers', error: 'Required' });
  });

  it('should return errors for missing or empty required answers', async () => {
    const error = await runValidation(badMRAnswer);

    const errorMessages = error.getFields().map((f) => f.error);

    expect(errorMessages).toEqual(
      expect.arrayContaining([
        'Required mr-1',
        'Required mr-2',
        'Required mr-3',
        'Required mr-4',
        'Required mr-6',
        'Required mr-7',
        'Required mr-8',
      ]),
    );
  });
});
