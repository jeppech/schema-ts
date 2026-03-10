import { None, Option, Some } from '@jeppech/results-ts';
import { SchemaErrors } from './errors.js';
import { schema, sync_validate, validated } from './internal.js';
import type { Schema } from './internal.js';
import type { Validator } from './types.js';
import type { StandardSchemaV1 } from './standard.js';

/**
 * Check if a value is considered empty (undefined, null, or empty string).
 */
function is_empty(value: unknown): boolean {
  return value === undefined || value === null || (typeof value === 'string' && value.length === 0);
}

/**
 * Transform the value to an `Option`.
 *
 * Any value that is undefined, null or an empty string will resolve to a `None` value.
 */
export function option<T>(s: Schema<unknown, T>): Schema<unknown, Option<T>> {
  return schema((value): StandardSchemaV1.Result<Option<T>> => {
    if (is_empty(value)) {
      return { value: None };
    }

    const result = sync_validate(s, value);

    if ('issues' in result && result.issues) {
      return { issues: result.issues };
    }

    return { value: Some(result.value) };
  });
}

/**
 * Mark the value as optional.
 *
 * Any value that is null, undefined or an empty string will resolve to undefined.
 */
export function optional<T>(s: Schema<unknown, T>): Schema<unknown, T | undefined> {
  return schema((value): StandardSchemaV1.Result<T | undefined> => {
    if (is_empty(value)) {
      return { value: undefined };
    }

    return sync_validate(s, value);
  });
}

/**
 * Mark a value as nullable.
 *
 * Any value that is null, undefined or an empty string will resolve to null.
 */
export function nullable<T>(s: Schema<unknown, T>): Schema<unknown, T | null> {
  return schema((value): StandardSchemaV1.Result<T | null> => {
    if (is_empty(value)) {
      return { value: null };
    }

    return sync_validate(s, value);
  });
}

/**
 * Add a default value.
 *
 * If the value is null, undefined or an empty string, the default value will be returned.
 */
export function fallback<T>(s: Schema<unknown, T>, default_value: T): Schema<unknown, T> {
  return schema((value) => {
    if (is_empty(value)) {
      return { value: default_value };
    }

    return sync_validate(s, value);
  });
}

/**
 * Cast a value to a number.
 */
export function to_number(s: Schema, ...validators: Validator<number>[]): Schema<unknown, number> {
  return schema((value) => {
    if (typeof value === 'boolean') {
      return validated(value ? 1 : 0, validators);
    }

    const result = sync_validate(s, value);

    if ('issues' in result && result.issues) {
      return { issues: result.issues };
    }

    return validated(Number(result.value), validators);
  });
}

/**
 * Convert a string value to lowercase.
 */
export function to_lowercase(...validators: Validator<string>[]): Schema<unknown, string> {
  return schema((value) => {
    if (typeof value !== 'string') {
      return { issues: [{ message: SchemaErrors.expected_string }] };
    }

    return validated(value.toLowerCase(), validators);
  });
}
