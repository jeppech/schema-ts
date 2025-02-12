import { None, Some } from '@jeppech/results-ts';
import { ValidationError } from './errors.js';
import { InferInstance, InferValue, Newable, Valuer } from './types.js';

/**
 * Parse a string as a string.
 */
export function string(err: string = 'expected a string') {
  return (value: unknown, field: string): string => {
    if (typeof value !== 'string') {
      throw new ValidationError(err, value, field);
    }
    return value;
  };
}

/**
 * Parse a string or number as a number.
 */
export function number(err: string = 'expected a number') {
  return (value: unknown, field: string): number => {
    if (typeof value !== 'number') {
      if (typeof value === 'string' && value.length > 0 && !isNaN(Number(value)) && value.match(/^\d+(\.\d+)?$/)) {
        return Number(value);
      }
      throw new ValidationError(err, value, field);
    }
    return value;
  };
}

/**
 * Parse a string or number as a timestamp.
 * Accepts any values that can be parsed by the `Date` constructor.
 */
export function timestamp(err: string = 'expected a valid timestamp') {
  return (value: unknown, field: string): Date => {
    if (typeof value !== 'number' && typeof value !== 'string') {
      throw new ValidationError(err, value, field);
    }

    const ts = new Date(value);

    if (isNaN(ts.valueOf())) {
      throw new ValidationError(err, value, field);
    }

    return ts;
  };
}

/**
 * Matches the different behavior of HTML checkboxes, that I have seen in the wild.
 */
export function checkbox(err: string = 'expected on, off, true, false or null') {
  return (value: unknown, field: string): boolean => {
    if (typeof value === 'undefined' || value === null) {
      return false;
    }

    if (typeof value !== 'string') {
      if (typeof value === 'boolean') {
        return value;
      }

      if (typeof value === 'number') {
        return value !== 0;
      }
      throw new ValidationError(err, value, field);
    }

    if (value == 'true' || value == 'on' || value == '1') {
      return true;
    }

    if (value == 'false' || value == 'off' || value == '0') {
      return false;
    }

    throw new ValidationError(err, value, field);
  };
}

/**
 * Test if a value is a boolean, or the exact string 'true' or 'false'
 */
export function bool(err: string = 'expected a boolean') {
  return (value: unknown, field: string): boolean => {
    if (typeof value !== 'boolean') {
      if (typeof value === 'string' && (value === 'true' || value === 'false')) {
        return value === 'true';
      }
      throw new ValidationError(err, value, field);
    }
    return value;
  };
}

/**
 * Instanciates the given class, with the value as the constructor argument.
 */
export function construct<T extends Newable>(newable: T, err = 'expected an instance of a class') {
  return (value: unknown, field: string) => {
    try {
      return new newable(value) as InferInstance<T>;
    } catch (contruct_err) {
      if (contruct_err instanceof Error) {
        throw new ValidationError(err, value, field, [], contruct_err);
      }
    }
  };
}

/**
 * Mark a value as optional.
 * Any value that is undefined, null or an empty string, will resolve to a None value
 */
export function optional<T extends Valuer>(valuer: T) {
  return (value: unknown, field: string) => {
    if (typeof value === 'string' && value.length === 0) {
      return None as InferValue<T, undefined>;
    }

    if (typeof value === 'undefined' || value === null) {
      return None as InferValue<T, undefined>;
    }

    return Some(valuer(value, field)) as InferValue<T, undefined>;
  };
}

/**
 * Mark a value as nullable.
 * Any value that is null, undefined or an empty string, will resolve to null.
 */
export function nullable<T extends Valuer>(valuer: T) {
  return (value: unknown, field: string) => {
    if (typeof value == 'string' && value.length === 0) {
      return null as InferValue<T, null>;
    }
    if (value === null || value === undefined) {
      return null as InferValue<T, null>;
    }
    return valuer(value, field) as InferValue<T, null>;
  };
}

/**
 * Cast a value to a number.
 */
export function to_number<T extends Valuer>(valuer: T) {
  return (value: unknown, field: string) => {
    if (typeof value === 'boolean') {
      return value ? 1 : 0;
    }
    return Number(valuer(value, field));
  };
}
