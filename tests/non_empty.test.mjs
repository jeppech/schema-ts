import { deepStrictEqual, equal, ok } from 'node:assert/strict';
import { test } from 'node:test';
import * as v from '@jeppech/schema-ts';
import { SchemaErrors } from '../lib/errors.js';

const validate = (schema, value) => schema['~standard'].validate(value);

test('non_empty returns a validation error for empty strings', () => {
  const error = v.non_empty()('', 'name');
  ok(error instanceof v.ValidationError);
  equal(error.message, SchemaErrors.empty_value);
  equal(error.value, '');
  equal(error.field, 'name');
  equal(v.non_empty()('hello', 'name'), undefined);
});

test('non_empty is opt-in and does not trim', () => {
  deepStrictEqual(validate(v.string(), ''), { value: '' });
  const schema = v.string(v.non_empty());
  deepStrictEqual(validate(schema, ''), { issues: [{ message: SchemaErrors.empty_value }] });
  for (const value of ['hello', '   ', '\t\n', '  hello  ']) {
    deepStrictEqual(validate(schema, value), { value });
  }
  for (const value of [undefined, null, 0, []]) {
    deepStrictEqual(validate(schema, value), { issues: [{ message: SchemaErrors.expected_string }] });
  }
});

test('trim runs before non_empty validation', () => {
  const schema = v.string({ trim: true }, v.non_empty());
  for (const value of ['', '   ', '\t\n', '\u00a0']) {
    deepStrictEqual(validate(schema, value), { issues: [{ message: SchemaErrors.empty_value }] });
  }
  deepStrictEqual(validate(schema, '  hello  '), { value: 'hello' });
});

test('non_empty supports custom validation messages', () => {
  const schema = v.string({ trim: true }, v.non_empty('Please enter a name'));
  deepStrictEqual(validate(schema, '   '), { issues: [{ message: 'Please enter a name' }] });
});

test('non_empty composes with validators and preserves object issue paths', () => {
  const schema = v.object({ name: v.string({ trim: true }, v.non_empty(), v.length(1, 32)) });
  deepStrictEqual(validate(schema, { name: '   ' }), {
    issues: [
      { message: SchemaErrors.empty_value, path: ['name'] },
      { message: SchemaErrors.invalid_length, path: ['name'] },
    ],
  });
});

test('optional empty strings bypass validation, but whitespace-only strings do not', () => {
  const schema = v.optional(v.string({ trim: true }, v.non_empty()));
  for (const value of [undefined, null, '']) {
    deepStrictEqual(validate(schema, value), { value: undefined });
  }
  deepStrictEqual(validate(schema, '   '), { issues: [{ message: SchemaErrors.empty_value }] });
  deepStrictEqual(validate(schema, '  hello  '), { value: 'hello' });
});
