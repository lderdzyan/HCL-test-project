import * as E from 'fp-ts/Either';
import { validateCreateFeelingWords } from '@/functions/mirror-reflection/validators/createFeelingWords';
import { CustomFeeling } from '@/lib/entities/mirror-reflection/custom-feeling';
import { CustomFeelingType } from '@/lib/entities/mirror-reflection/mirror-reflection';
import { ValidationError } from '@/lib/errors';

describe('validateCreateFeelingWords validator', () => {
  const runValidation = async (data: CustomFeeling): Promise<ValidationError> => {
    const result = await validateCreateFeelingWords(data)();
    if (E.isRight(result)) {
      return result.right;
    }
    throw new Error('Unexpected Left value from TaskEither');
  };

  const findError = (error: ValidationError, key: string) => {
    return error.getFields().find((field) => field.key === key);
  };

  it.each([
    [{ type: '', text: ['happy'] }, 'type', 'Required'],
    [{ type: 'upFeeling', text: [] }, 'text', 'Required'],
    [{ type: 'downFeeling', text: ['good', '', 'bad'] }, 'text', 'Values should not be empty.'],
    [{ type: null, text: ['happy'] }, 'type', 'Required'],
    [{ type: 'topic', text: null }, 'text', 'Required'],
    [{ type: 'topic', text: [null, 'angry'] }, 'text', 'Values should not be empty.'],
    [{ type: 'topic', text: ['  '] }, 'text', 'Values should not be empty.'],
  ])('returns error for invalid input %j', async (input, expectedField, expectedError) => {
    const error = await runValidation(input as CustomFeeling);
    expect(error.hasError()).toBe(true);

    const fieldError = findError(error, expectedField);
    expect(fieldError).toBeDefined();
    expect(fieldError?.error).toBe(expectedError);
  });

  it('returns no errors for valid input', async () => {
    const input = {
      type: CustomFeelingType.topic,
      text: ['confused', 'focused'],
    };

    const error = await runValidation(input as CustomFeeling);
    expect(error.hasError()).toBe(false);
    expect(error.getFields()).toHaveLength(0);
  });
});
