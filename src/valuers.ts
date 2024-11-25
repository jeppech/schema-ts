import { Some } from '@jeppech/results-ts';
import { InferInstance, InferValue, Newable, Valuer, Validator } from './types.js';

export function as<T extends Valuer>(val: T, ...validators: Validator<InferValue<T>>[]) {
  return (value: unknown) => {
    const parsed = val(value) as InferValue<T>;

    const _internal_errors: string[] = [];
    for (const validate of validators) {
      const err = validate(parsed);
      if (err) {
        _internal_errors.push(err);
      }
    }

    if (_internal_errors.length) {
      console.log(_internal_errors);
      throw Error('some errors');
    }

    return parsed;
  };
}

/**
 * Parse a string as a string.
 */
export function string(err: string = 'expected a string') {
  return (value: unknown): string => {
    if (typeof value !== 'string') {
      throw new Error(err);
    }
    return value;
  };
}

/**
 * Parse a string or number as a number.
 */
export function number(err: string = 'expected a number') {
  return (value: unknown): number => {
    if (typeof value !== 'number') {
      if (typeof value === 'string' && value.length > 0 && !isNaN(Number(value)) && value.match(/^\d+(\.\d+)?$/)) {
        return Number(value);
      }
      throw new Error(err);
    }
    return value;
  };
}

/**
 * Parse a string or number as a timestamp.
 * Accepts any values that can be parsed by the `Date` constructor.
 */
export function timestamp(err: string = 'expected a valid timestamp') {
  return (value: unknown): Date => {
    if (typeof value !== 'number' && typeof value !== 'string') {
      throw new Error(err);
    }

    const ts = new Date(value);

    if (isNaN(ts.valueOf())) {
      throw new Error(err);
    }

    return ts;
  };
}

/**
 * Matches the default behavior of HTML checkboxes
 */
export function checkbox(err: string = 'expected "on" or null') {
  return (value: unknown): boolean => {
    console.log(value);
    if (typeof value === 'undefined' || value === null) {
      return false;
    }

    if (typeof value !== 'string') {
      throw new Error(err);
    }
    return value === 'on';
  };
}

/**
 * Test if a value is a boolean, or the exact string 'true' or 'false'
 */
export function bool(err: string = 'expected a boolean') {
  return (value: unknown): boolean => {
    if (typeof value !== 'boolean') {
      if (typeof value === 'string' && (value === 'true' || value === 'false')) {
        return value === 'true';
      }
      throw new Error(err);
    }
    return value;
  };
}

/**
 * Instanciates the given class, with the value as the constructor argument.
 */
export function construct<T extends Newable>(newable: T, err = 'expected an instance of a class') {
  return (value: unknown) => {
    try {
      return new newable(value) as InferInstance<T>;
    } catch (err) {
      throw new Error(err as string);
    }
  };
}

/**
 * Mark a value as optional.
 * Any value that is undefined or null will resolve to a None value
 */
export function optional<T extends Valuer>(maybe: T) {
  return (value?: unknown) => {
    console.log(value);
    return Some(typeof value === 'undefined' || value === null ? undefined : maybe(value)) as InferValue<T, undefined>;
  };
}
