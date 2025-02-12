import { ValidationError } from './errors.js';

/**
 * The value must be an exact match of `expected`.
 */
export function literal(expected: unknown, err = 'invalid value') {
  return (value: unknown, field: string) => {
    if (value !== expected) {
      return new ValidationError(err, value, field, [expected]);
    }
  };
}

/**
 * The value must be between `min` and `max`.
 */
export function minmax(min: number, max: number, err = 'out of range') {
  return (value: number, field: string) => {
    if (value < min || value > max) {
      return new ValidationError(err, value, field, [min, max]);
    }
  };
}

/**
 * The value may not be shorter than `min` or longer than `max`.
 */
export function length(min: number, max: number, err = 'invalid length') {
  return (value: string, field: string) => {
    if (value.length < min || value.length > max) {
      return new ValidationError(err, value, field, [min, max]);
    }
  };
}

/**
 * The value must be a valid email address.
 */
export function email(err = 'expected an email') {
  return (value: string, field: string) => {
    if (!value.match(/^((?!\.)[\w\-_.]*[^.])(@\w+)(\.\w+(\.\w+)?[^.\W])$/)) {
      return new ValidationError(err, value, field);
    }
  };
}

/**
 * The value must be a valid formatted imei.
 */
export function imei(err = 'invalid formatted imei') {
  return (value: string, field: string) => {
    if (!value.match(/^[0-9]{2}s?[0-9]{6}s?[0-9]{6}s?[0-9]{1,3}$/)) {
      return new ValidationError(err, value, field);
    }
  };
}
