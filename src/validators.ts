import { ValidationError } from './errors.js';

export function minmax(min: number, max: number, err = 'out of range') {
  return (value: number, field: string) => {
    if (value < min || value > max) {
      return new ValidationError(err, value, field, [min, max]);
    }
  };
}

export function length(min: number, max: number, err = 'invalid length') {
  return (value: string, field: string) => {
    if (value.length < min || value.length > max) {
      return new ValidationError(err, value, field, [min, max]);
    }
  };
}

export function email(err = 'expected an email') {
  return (value: string, field: string) => {
    if (!value.match(/^((?!\.)[\w\-_.]*[^.])(@\w+)(\.\w+(\.\w+)?[^.\W])$/)) {
      return new ValidationError(err, value, field);
    }
  };
}

export function imei(err = 'invalid formatted imei') {
  return (value: string, field: string) => {
    if (!value.match(/^[0-9]{2}s?[0-9]{6}s?[0-9]{6}s?[0-9]{1,3}$/)) {
      return new ValidationError(err, value, field);
    }
  };
}
