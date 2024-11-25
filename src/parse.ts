import { Err, Ok, type Result } from '@jeppech/results-ts';
import type { InferObject, SchemaProperties } from './types.js';

export function parse_formdata<T extends SchemaProperties>(data: FormData, schema: T): Result<InferObject<T>, Error[]> {
  const obj: Record<string, unknown> = {};

  try {
    for (const key of Object.keys(schema)) {
      const value_asserter = schema[key];
      const value = data.get(key);

      obj[key] = value_asserter(value);
    }
  } catch (err) {
    return Err(err) as Result<InferObject<T>, Error[]>;
  }

  return Ok(obj) as Result<InferObject<T>, Error[]>;
}

export function parse_object<T extends SchemaProperties>(
  data: Record<string, unknown>,
  schema: T,
): Result<InferObject<T>, Error[]> {
  const obj: Record<string, unknown> = {};

  try {
    for (const key in schema) {
      const asserter = schema[key];
      if (asserter) {
        obj[key] = asserter(data[key]);
      }
    }
  } catch (err) {
    return Err(err) as Result<InferObject<T>, Error[]>;
  }

  return Ok(obj) as Result<InferObject<T>, Error[]>;
}
