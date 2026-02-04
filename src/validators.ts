import { SchemaErrors, ValidationError } from './errors.js';

/**
 * The value must be an exact match of `expected`.
 */
export function exactly(expected: unknown, err = SchemaErrors.invalid_value) {
  return (value: unknown, field: string) => {
    if (value !== expected) {
      return new ValidationError(err, value, field, [expected]);
    }
  };
}

/**
 * The value must be between `min` and `max`.
 */
export function minmax(min: number, max: number, err = SchemaErrors.out_of_range) {
  return (value: number, field: string) => {
    if (value < min || value > max) {
      return new ValidationError(err, value, field, [min, max]);
    }
  };
}

/**
 * The value may not be shorter than `min` or longer than `max`.
 */
export function length(min: number, max: number, err = SchemaErrors.invalid_length) {
  return (value: string | Array<unknown>, field: string) => {
    if (typeof value !== 'string' && !Array.isArray(value)) {
      return new ValidationError(SchemaErrors.invalid_value, value, field, [min, max]);
    }

    if (value.length < min || value.length > max) {
      return new ValidationError(SchemaErrors.invalid_length, value, field, [min, max]);
    }
  };
}
