import { Err, Ok, type Result } from '@jeppech/results-ts';
import type { InferObject, InferValue, SchemaProperties, Validator, Valuer } from './types.js';
import { ValidationError, ValidationErrors } from './errors.js';

export function as<T extends Valuer>(valuer: T, ...validators: Validator<InferValue<T>>[]) {
  return (value: unknown, field: string) => {
    const parsed = valuer(value, field) as InferValue<T>;

    const validation_errors = new ValidationErrors();
    for (const validate of validators) {
      const err = validate(parsed, field);
      if (err) {
        validation_errors.errors.push(err);
      }
    }

    if (validation_errors.errors.length) {
      throw validation_errors;
    }

    return parsed;
  };
}

export function parse_formdata<T extends SchemaProperties>(
  data: FormData,
  schema: T,
): Result<InferObject<T>, ValidationError[]> {
  const obj: Record<string, unknown> = {};

  try {
    for (const key of Object.keys(schema)) {
      const valuer = schema[key];
      const value = data.get(key);

      obj[key] = valuer(value, key);
    }
  } catch (err: unknown) {
    if (err instanceof ValidationErrors) {
      return Err(err.errors);
    }

    if (err instanceof ValidationError) {
      return Err([err]);
    }

    return Err([new ValidationError('unknown error', 'unknown', 'unknown', [], err)]);
  }

  return Ok(obj as InferObject<T>);
}

export function parse_object<T extends SchemaProperties>(
  data: Record<string, unknown>,
  schema: T,
): Result<InferObject<T>, Error[]> {
  const obj: Record<string, unknown> = {};

  try {
    for (const key in schema) {
      const valuer = schema[key];
      if (valuer) {
        obj[key] = valuer(data[key], key);
      }
    }
  } catch (err) {
    return Err(err) as Result<InferObject<T>, Error[]>;
  }

  return Ok(obj) as Result<InferObject<T>, Error[]>;
}
