export class ValidationError extends Error {
  constructor(
    /**
     * The error message
     */
    public message: string,

    /**
     * Value we're trying to validate
     */
    public value: unknown,

    /**
     * The field that the value is associated with
     */
    public field: string,

    /**
     * List parameters passed to the Valuer or Validator
     */
    public params?: unknown[],

    /**
     * If the error was caused by another error, it can be passed here
     */
    cause?: Error,
  ) {
    super(message, { cause });
    this.name = 'ValidationError';
  }
}

export class ValidationErrors {
  public errors: ValidationError[] = [];
  constructor() {}
}
