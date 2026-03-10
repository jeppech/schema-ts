import { SchemaErrors } from './errors.js';
import { schema, sync_validate, validated } from './internal.js';
import type { SchemaProperties, Validator } from './types.js';
import { StandardSchemaV1 } from './standard.js';

export type { Schema } from './internal.js';

/**
 * Parse input as a string.
 */
export function string(...validators: Validator<string>[]): StandardSchemaV1<unknown, string> {
  return schema((value) => {
    if (typeof value !== 'string') {
      return { issues: [{ message: SchemaErrors.expected_string }] };
    }
    return validated(value, validators);
  });
}

/**
 * Parses input as e-mail, converted to lowercase.
 */
export function email(...validators: Validator<string>[]): StandardSchemaV1<unknown, string> {
  // eslint-disable-next-line no-useless-escape
  const email_rx = /^(?!\.)(?!.*\.\.)([a-z0-9_'+\-\.]*)[a-z0-9_'+\-]@([a-z0-9][a-z0-9\-]*\.)+[a-z]{2,}$/;

  return schema((value) => {
    if (typeof value !== 'string') {
      return { issues: [{ message: SchemaErrors.expected_string }] };
    }

    const lower = value.toLowerCase();

    if (!lower.match(email_rx)) {
      return { issues: [{ message: SchemaErrors.invalid_formatted_email }] };
    }

    return validated(lower, validators);
  });
}

/**
 * Parse a string or number as a number.
 */
export function number(...validators: Validator<number>[]): StandardSchemaV1<unknown, number> {
  return schema((value) => {
    if (typeof value === 'number') {
      return validated(value, validators);
    }

    if (typeof value === 'string' && value.length > 0 && !isNaN(Number(value)) && value.match(/^\d+(\.\d+)?$/)) {
      return validated(Number(value), validators);
    }

    return { issues: [{ message: SchemaErrors.expected_number }] };
  });
}

/**
 * Parse a string or number as a timestamp.
 * Accepts any values that can be parsed by the `Date` constructor.
 */
export function timestamp(...validators: Validator<Date>[]): StandardSchemaV1<unknown, Date> {
  return schema((value) => {
    if (typeof value !== 'number' && typeof value !== 'string') {
      return { issues: [{ message: SchemaErrors.expected_valid_timestamp }] };
    }

    const ts = new Date(value);

    if (isNaN(ts.valueOf())) {
      return { issues: [{ message: SchemaErrors.expected_valid_timestamp }] };
    }

    return validated(ts, validators);
  });
}

/**
 * Matches the different behavior of HTML checkboxes, that I have seen in the wild.
 */
export function checkbox(...validators: Validator<boolean>[]): StandardSchemaV1<unknown, boolean> {
  return schema((value) => {
    if (typeof value === 'undefined' || value === null) {
      return validated(false, validators);
    }

    if (typeof value === 'boolean') {
      return validated(value, validators);
    }

    if (typeof value === 'number') {
      return validated(value !== 0, validators);
    }

    if (typeof value === 'string') {
      if (value == 'true' || value == 'on' || value == '1') {
        return validated(true, validators);
      }

      if (value == 'false' || value == 'off' || value == '0') {
        return validated(false, validators);
      }
    }

    return { issues: [{ message: SchemaErrors.expected_truthy_or_falsy }] };
  });
}

/**
 * Test if a value is a boolean, or the exact string 'true' or 'false'
 */
export function bool(...validators: Validator<boolean>[]): StandardSchemaV1<unknown, boolean> {
  return schema((value) => {
    if (typeof value === 'boolean') {
      return validated(value, validators);
    }

    if (typeof value === 'string' && (value === 'true' || value === 'false')) {
      return validated(value === 'true', validators);
    }

    return { issues: [{ message: SchemaErrors.expected_boolean }] };
  });
}

/**
 * Expects the value to be one of the literals defined in the `expected` array.
 */
export function literal<const T>(expected: T | T[], err = SchemaErrors.invalid_value): StandardSchemaV1<unknown, T> {
  const expected_arr = Array.isArray(expected) ? expected : [expected];

  return schema((value): StandardSchemaV1.Result<T> => {
    if (expected_arr.includes(value as T)) {
      return { value: value as T };
    }

    return { issues: [{ message: err }] };
  });
}

/**
 * Expects a value to be an array where each item matches the given schema.
 */
export function list<T>(
  item_schema: StandardSchemaV1<unknown, T>,
  ...validators: Validator<T[]>[]
): StandardSchemaV1<unknown, T[]> {
  return schema((value) => {
    if (!Array.isArray(value)) {
      return { issues: [{ message: SchemaErrors.expected_array }] };
    }

    const result: T[] = [];
    const issues: StandardSchemaV1.Issue[] = [];

    for (let i = 0; i < value.length; i++) {
      const item_result = sync_validate(item_schema, value[i]);

      if ('issues' in item_result && item_result.issues) {
        for (const issue of item_result.issues) {
          issues.push({
            message: issue.message,
            path: [i, ...(issue.path ?? [])],
          });
        }
      } else {
        result.push(item_result.value);
      }
    }

    if (issues.length > 0) {
      return { issues };
    }

    return validated(result, validators);
  });
}

/**
 * Expects the value to be an object matching the given schema properties.
 */
export function object<T extends SchemaProperties>(
  struct: T,
): StandardSchemaV1<Record<string, unknown>, { [K in keyof T]: StandardSchemaV1.InferOutput<T[K]> }> {
  type Output = { [K in keyof T]: StandardSchemaV1.InferOutput<T[K]> };

  return schema((value) => {
    if (typeof value === 'undefined' || value === null) {
      return { issues: [{ message: SchemaErrors.expected_object }] };
    }

    if (typeof value === 'string') {
      try {
        value = JSON.parse(value);
      } catch {
        return { issues: [{ message: SchemaErrors.expected_object }] };
      }
    }

    if (typeof value !== 'object') {
      return { issues: [{ message: SchemaErrors.expected_object }] };
    }

    const obj = value as Record<string, unknown>;
    const parsed: Record<string, unknown> = {};
    const issues: StandardSchemaV1.Issue[] = [];

    for (const key in struct) {
      const field_schema = struct[key];
      const result = sync_validate(field_schema, obj[key]);

      if ('issues' in result && result.issues) {
        for (const issue of result.issues) {
          issues.push({
            message: issue.message,
            path: [key, ...(issue.path ?? [])],
          });
        }
      } else {
        parsed[key] = result.value;
      }
    }

    if (issues.length > 0) {
      return { issues };
    }

    return { value: parsed as Output };
  }) as StandardSchemaV1<Record<string, unknown>, Output>;
}
