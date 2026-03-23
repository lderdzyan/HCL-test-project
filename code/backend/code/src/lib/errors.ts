export class WrongDataError extends Error {
  constructor(message: string = 'Wrong data') {
    super(message);
  }
}

export class BadRequestError extends Error {
  constructor(message: string = 'Bad request') {
    super(message);
  }
}

type ErrorField = { key: string; error: string };
export class ValidationError extends Error {
  private readonly fields: ErrorField[] = [];

  constructor() {
    super('Validation error');
  }

  addField(key: string, error: string) {
    this.fields.push({ key, error });
  }

  addFields(fieldsToAdd: ErrorField[]) {
    fieldsToAdd.forEach((field) => this.addField(field.key, field.error));
  }

  hasError(): boolean {
    return this.fields.length > 0;
  }

  getFields(): ErrorField[] {
    return this.fields;
  }
}
