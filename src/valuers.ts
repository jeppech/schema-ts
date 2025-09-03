import { None, Option, Some } from '@jeppech/results-ts';
import { SchemaErrors, ValidationError } from './errors.js';
import {
  InferInstance,
  InferObject,
  InferValue,
  Newable,
  SchemaProperties,
  SuggestKeys,
  Validator,
  Valuer,
} from './types.js';
import { parse, validate } from './parse.js';

/**
 * Parse a string as a string.
 */
export function string(...validators: Validator<string>[]) {
  return (value: unknown, field: string): string => {
    if (typeof value !== 'string') {
      throw new ValidationError(SchemaErrors.expected_string, value, field);
    }
    return validate(value, field, ...validators);
  };
}

/**
 * Parse a string or number as a number.
 */
export function number(...validators: Validator<number>[]) {
  return (value: unknown, field: string): number => {
    if (typeof value !== 'number') {
      if (typeof value === 'string' && value.length > 0 && !isNaN(Number(value)) && value.match(/^\d+(\.\d+)?$/)) {
        return validate(Number(value), field, ...validators);
      }
      throw new ValidationError(SchemaErrors.expected_number, value, field);
    }
    return validate(value, field, ...validators);
  };
}

/**
 * Parse a string or number as a timestamp.
 * Accepts any values that can be parsed by the `Date` constructor.
 */
export function timestamp(...validators: Validator<Date>[]) {
  return (value: unknown, field: string): Date => {
    if (typeof value !== 'number' && typeof value !== 'string') {
      throw new ValidationError(SchemaErrors.expected_valid_timestamp, value, field);
    }

    const ts = new Date(value);

    if (isNaN(ts.valueOf())) {
      throw new ValidationError(SchemaErrors.expected_valid_timestamp, value, field);
    }

    return validate(ts, field, ...validators);
  };
}

/**
 * Matches the different behavior of HTML checkboxes, that I have seen in the wild.
 */
export function checkbox(...validators: Validator<unknown>[]) {
  return (value: unknown, field: string): boolean => {
    if (typeof value === 'undefined' || value === null) {
      return validate(false, field, ...validators);
    }

    if (typeof value !== 'string') {
      if (typeof value === 'boolean') {
        return validate(value, field, ...validators);
      }

      if (typeof value === 'number') {
        return validate(value !== 0, field, ...validators);
      }
      throw new ValidationError(SchemaErrors.expected_truthy_or_falsy, value, field);
    }

    if (value == 'true' || value == 'on' || value == '1') {
      return validate(true, field, ...validators);
    }

    if (value == 'false' || value == 'off' || value == '0') {
      return validate(false, field, ...validators);
    }

    throw new ValidationError(SchemaErrors.expected_truthy_or_falsy, value, field);
  };
}

/**
 * Test if a value is a boolean, or the exact string 'true' or 'false'
 */
export function bool(...validators: Validator<unknown>[]) {
  return (value: unknown, field: string): boolean => {
    if (typeof value !== 'boolean') {
      if (typeof value === 'string' && (value === 'true' || value === 'false')) {
        return validate(value === 'true', field, ...validators);
      }
      throw new ValidationError(SchemaErrors.expected_boolean, value, field);
    }
    return validate(value, field, ...validators);
  };
}

/**
 * Instanciates the given class, with the value as the constructor argument.
 */
export function construct<T extends Newable, U extends InferInstance<T>>(newable: T, ...validators: Validator<U>[]) {
  return (value: unknown, field: string) => {
    try {
      return validate(new newable(value) as U, field, ...validators);
    } catch (contruct_err) {
      if (contruct_err instanceof Error) {
        throw new ValidationError(SchemaErrors.expected_instance_of_a_class, value, field, [], contruct_err);
      }
    }
  };
}

/**
 * Expects a value to be an array of the given valuer
 */
export function array<T extends Valuer, U extends InferValue<T>>(valuer: T, ...validators: Validator<U>[]) {
  return (value: unknown, field: string): U[] => {
    if (!Array.isArray(value)) {
      throw new ValidationError(SchemaErrors.expected_array, value, field);
    }

    const result: U[] = [];

    for (const item of value) {
      result.push(validate(valuer(item, field) as U, field, ...validators));
    }

    return result;
  };
}

/**
 * Transform the value to an `Option`.
 *
 * Any value that is undefined, null or an empty string, will resolve to a `None` value
 */
export function option<T extends Valuer, U extends InferValue<T>>(valuer: T, ...validators: Validator<U>[]) {
  return (value: unknown, field: string): Option<U> => {
    if (typeof value === 'string' && value.length === 0) {
      return None;
    }

    if (typeof value === 'undefined' || value === null) {
      return None;
    }

    return Some(validate(valuer(value, field) as U, field, ...validators));
  };
}

/**
 * Add a default value
 *
 * If the value isnull, undefined or an empty string, the default value will be returned.
 */
export function fallback<T extends Valuer, U extends InferValue<T>>(
  valuer: T,
  default_value: U,
  ...validators: Validator<U>[]
) {
  return (value: unknown, field: string): U => {
    if (typeof value === 'string' && value.length === 0) {
      return default_value;
    }

    if (typeof value === 'undefined' || value === null) {
      return default_value;
    }
    return validate(valuer(value, field) as U, field, ...validators);
  };
}

/**
 * Mark the value as optional
 *
 * Any value that is null, undefined or an empty string, will resolve to undefined.
 */
export function optional<T extends Valuer, U extends InferValue<T>>(valuer: T, ...validators: Validator<U>[]) {
  return (value: unknown, field: string): U | undefined => {
    if (typeof value == 'string' && value.length === 0) {
      return undefined;
    }

    if (typeof value === 'undefined' || value === null) {
      return undefined;
    }
    return validate(valuer(value, field) as U, field, ...validators);
  };
}

/**
 * Mark a value as nullable.
 *
 * Any value that is null, undefined or an empty string, will resolve to null.
 */
export function nullable<T extends Valuer, U extends InferValue<T>>(valuer: T, ...validators: Validator<U>[]) {
  return (value: unknown, field: string): U | null => {
    if (typeof value == 'string' && value.length === 0) {
      return null;
    }
    if (value === null || value === undefined) {
      return null;
    }
    return validate(valuer(value, field) as U, field, ...validators);
  };
}

/**
 * Cast a value to a number.
 */
export function to_number<T extends Valuer>(valuer: T, ...validators: Validator<number>[]) {
  return (value: unknown, field: string) => {
    if (typeof value === 'boolean') {
      return value ? 1 : 0;
    }
    return validate(Number(valuer(value, field)), field, ...validators);
  };
}

/**
 * Expects the value to be a schema
 */
export function schema<T extends SchemaProperties, U extends InferObject<T>>(schema: T, ...validators: Validator<U>[]) {
  return (value: unknown, field: string) => {
    if (typeof value === 'undefined' || value === null) {
      throw new ValidationError(`cannot parse empty schema`, value, field);
    }

    const result = parse(schema, value as T);

    if (result.is_err()) {
      throw new ValidationError(`Could not parse schema`, value, field);
    }

    return validate(result.unwrap() as U, field, ...validators);
  };
}
