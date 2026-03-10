import { Err, Ok, type Result } from '@jeppech/results-ts';
import { ValidationError } from './errors.js';
import type { StandardSchemaV1 } from './standard.js';
import type { Schema } from './internal.js';

/**
 * Convert StandardSchemaV1 issues into ValidationError[].
 */
function issues_to_errors(issues: ReadonlyArray<StandardSchemaV1.Issue>, field: string): ValidationError[] {
  return issues.map((issue) => {
    const path = issue.path ? issue.path.map((p) => (typeof p === 'object' ? p.key : p)).join('.') : '';
    const full_field = path ? `${field}.${path}` : field;
    return new ValidationError(issue.message, undefined, full_field);
  });
}

/**
 * Match form field names with array notation.
 */
const fd_array_key_rx = new RegExp(/(\w+)\[(.+)?\]/);

/**
 * Parse data using a Schema object (e.g. returned by `object()`).
 *
 * Accepts `FormData`, a plain object, or a JSON string as input data.
 */
export function parse<Output>(
  schema: Schema<unknown, Output>,
  data: FormData | Record<string, unknown> | string,
): Result<Output, ValidationError[]> {
  let obj: Record<string, unknown>;

  if (data instanceof FormData) {
    obj = formdata_to_object(data);
  } else if (typeof data === 'string') {
    obj = JSON.parse(data);
  } else {
    obj = data;
  }

  const result = schema['~standard'].validate(obj) as StandardSchemaV1.Result<Output>;

  if ('issues' in result && result.issues) {
    return Err(issues_to_errors(result.issues, ''));
  }

  return Ok(result.value);
}

/**
 * Extract FormData into a plain object, handling array notation.
 */
function formdata_to_object(fd: FormData): Record<string, unknown> {
  const obj: Record<string, unknown> = {};
  const seen = new Set<string>();

  for (const key of fd.keys()) {
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);

    const [match, plain_key] = key.match(fd_array_key_rx) || [];
    if (!match) {
      obj[key] = fd.get(key);
    } else {
      obj[plain_key] = fd.getAll(key);
    }
  }

  return obj;
}
