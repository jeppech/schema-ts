import type { Validator } from './types.js';
import type { StandardSchemaV1 } from './standard.js';

const vendor = '@jeppech/schema-ts';

/**
 * A synchronous StandardSchemaV1 schema. This is the type returned by all
 * schema functions in this library.
 */
export type Schema<Input = unknown, Output = Input> = StandardSchemaV1<Input, Output>;

/**
 * Helper to create a Schema object.
 */
export function schema<Output>(validate: (value: unknown) => StandardSchemaV1.Result<Output>): Schema<unknown, Output> {
  return {
    '~standard': {
      version: 1,
      vendor,
      validate,
    },
  };
}

/**
 * Synchronously validate a value against a schema.
 * All schemas in this library are synchronous, so this is safe to cast.
 */
export function sync_validate<T>(s: Schema<unknown, T>, value: unknown): StandardSchemaV1.Result<T> {
  return s['~standard'].validate(value) as StandardSchemaV1.Result<T>;
}

/**
 * Run validators and return issues. Returns undefined if all pass.
 */
export function run_validators<T>(value: T, validators: Validator<T>[]): StandardSchemaV1.Issue[] | undefined {
  const issues: StandardSchemaV1.Issue[] = [];

  for (const v of validators) {
    const err = v(value, '');
    if (err) {
      issues.push({ message: err.message });
    }
  }

  return issues.length > 0 ? issues : undefined;
}

/**
 * Helper that runs validators and returns a success or failure result.
 */
export function validated<T>(value: T, validators: Validator<T>[]): StandardSchemaV1.Result<T> {
  const issues = run_validators(value, validators);
  if (issues) {
    return { issues };
  }
  return { value };
}
