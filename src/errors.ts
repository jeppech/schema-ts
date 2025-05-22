export const SchemaErrors = {
  invalid_value: 'invalid_value',
  out_of_range: 'out_of_range',
  invalid_length: 'invalid_length',
  invalid_formatted_email: 'invalid_formatted_email',
  invalid_formatted_imei: 'invalid_formatted_imei',
  unknown_error: 'unknown_error',
  expected_string: 'expected_string',
  expected_number: 'expected_number',
  expected_valid_timestamp: 'expected_valid_timestamp',
  expected_truthy_or_falsy: 'expected_truthy_or_falsy',
  expected_boolean: 'expected_boolean',
  expected_instance_of_a_class: 'expected_instance_of_a_class',
  expected_array: 'expected_array',
  valuer_must_be_a_function: 'valuer_must_be_a_function',
} as const;

export type SchemaError = string | (typeof SchemaErrors)[keyof typeof SchemaErrors];

export class ValidationError<T extends SchemaError = SchemaError> extends Error {
  constructor(
    /**
     * The error message
     */
    public message: T,

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
     * If the error was caused by an unknown error, it can be passed here
     */
    cause?: unknown,
  ) {
    super(message, { cause });
    this.name = 'ValidationError';
  }
}

export class ValidationErrors {
  public errors: ValidationError[] = [];
  constructor() {}
}
