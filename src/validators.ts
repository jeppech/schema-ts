import { SchemaErrors, ValidationError } from './errors.js';

/**
 * The value must be an exact match of `expected`.
 */
export function literal(expected: unknown, err = SchemaErrors.invalid_value) {
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

/**
 * The value must be a valid email address.
 */
export function email(err = SchemaErrors.invalid_formatted_email) {
  return (value: string, field: string) => {
    if (!value.match(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)) {
      return new ValidationError(err, value, field);
    }
  };
}

/**
 * The value must be a valid formatted imei.
 */
export function imei(err = SchemaErrors.invalid_formatted_imei) {
  return (value: string, field: string) => {
    if (!value.match(/^[0-9]{2}s?[0-9]{6}s?[0-9]{6}s?[0-9]{1,3}$/)) {
      return new ValidationError(err, value, field);
    }
  };
}
