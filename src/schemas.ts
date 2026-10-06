import { SchemaErrors } from './errors.js';
import { schema, sync_validate, validated } from './internal.js';
import type { SchemaProperties, Validator } from './types.js';
import type { StandardSchemaV1 } from './standard.js';

export type { Schema } from './internal.js';

/**
 * Formats the string into the given case
 * none (default): does nothing
 * lower: converts to lowercase
 * upper: converts to uppercase
 * formal: converts to formal case, (e.g. "hello world" -> "Hello World")
 */
export type StringCase = 'none' | 'lower' | 'upper' | 'formal';

export type StringOptions = {
  trim?: boolean;
  case?: StringCase;
};

function is_string_options(value: unknown): value is StringOptions {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function apply_string_case(value: string, case_mode: StringCase): string {
  if (case_mode === 'none') {
    return value;
  }

  if (case_mode === 'lower') {
    return value.toLowerCase();
  }

  if (case_mode === 'upper') {
    return value.toUpperCase();
  }

  const lower = value.toLowerCase();

  return lower.replace(/(^|[ \-'])[a-z]/g, (match) => match.toUpperCase());
}

/**
 * Parse input as a string.
 */
export function string(...validators: Validator<string>[]): StandardSchemaV1<string, string>;
export function string(options: StringOptions, ...validators: Validator<string>[]): StandardSchemaV1<string, string>;
export function string(
  ...args: [StringOptions, ...Validator<string>[]] | Validator<string>[]
): StandardSchemaV1<string, string> {
  const has_options = is_string_options(args[0]);
  const options: StringOptions | undefined = has_options ? (args[0] as StringOptions) : undefined;
  const validators = (has_options ? args.slice(1) : args) as Validator<string>[];

  return schema((value) => {
    if (typeof value !== 'string') {
      return { issues: [{ message: SchemaErrors.expected_string }] };
    }

    const normalized = options?.trim ? value.trim() : value;
    const case_mode = options?.case ?? 'none';
    const transformed = apply_string_case(normalized, case_mode);

    return validated(transformed, validators);
  });
}

// eslint-disable-next-line no-useless-escape
const email_rx = /^(?!\.)(?!.*\.\.)([a-z0-9_'+\-\.]*)[a-z0-9_'+\-]@([a-z0-9][a-z0-9\-]*\.)+[a-z]{2,}$/;

/**
 * Parses input as e-mail, converted to lowercase.
 */
export function email(...validators: Validator<string>[]): StandardSchemaV1<string, string> {
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
 * The inferred input defaults to string; use `number<string | number>()` for native numbers too.
 */
export function number<T extends string | number = string>(
  ...validators: Validator<number>[]
): StandardSchemaV1<NoInfer<T>, number> {
  return schema((value) => {
    if (typeof value === 'number') {
      if (!isFinite(value)) {
        return { issues: [{ message: SchemaErrors.expected_number }] };
      }
      return validated(value, validators);
    }

    if (typeof value === 'string' && value.length > 0) {
      const num = Number(value);
      if (!isNaN(num) && isFinite(num)) {
        return validated(num, validators);
      }
    }

    return { issues: [{ message: SchemaErrors.expected_number }] };
  });
}

/**
 * Parse a string or number as a timestamp.
 * Accepts any values that can be parsed by the `Date` constructor.
 * The inferred input defaults to string; select a broader input type for numbers or Dates.
 */
export function timestamp<T extends string | number | Date = string>(
  ...validators: Validator<Date>[]
): StandardSchemaV1<NoInfer<T>, Date> {
  return schema((value) => {
    if (value instanceof Date) {
      if (isNaN(value.valueOf())) {
        return { issues: [{ message: SchemaErrors.expected_valid_timestamp }] };
      }
      return validated(value, validators);
    }

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
 * The inferred input defaults to string | undefined; runtime coercion is unchanged.
 */
export function checkbox<T extends string | boolean | number | null | undefined = string | undefined>(
  ...validators: Validator<boolean>[]
): StandardSchemaV1<NoInfer<T>, boolean> {
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
 * The inferred input defaults to string; use `bool<string | boolean>()` for native booleans too.
 */
export function bool<T extends string | boolean = string>(
  ...validators: Validator<boolean>[]
): StandardSchemaV1<NoInfer<T>, boolean> {
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
export function literal<const T>(expected: T | T[], err = SchemaErrors.invalid_value): StandardSchemaV1<T, T> {
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
export function list<T, U = unknown>(
  item_schema: StandardSchemaV1<U, T>,
  ...validators: Validator<T[]>[]
): StandardSchemaV1<U[], T[]> {
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
): StandardSchemaV1<
  { [K in keyof T]: StandardSchemaV1.InferInput<T[K]> },
  { [K in keyof T]: StandardSchemaV1.InferOutput<T[K]> }
> {
  type Input = { [K in keyof T]: StandardSchemaV1.InferInput<T[K]> };
  type Output = { [K in keyof T]: StandardSchemaV1.InferOutput<T[K]> };

  return schema<Output, Input>((value) => {
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
  });
}
