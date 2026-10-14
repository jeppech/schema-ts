import { deepStrictEqual, equal, ok } from 'node:assert/strict';
import { test } from 'node:test';
import * as v from '@jeppech/schema-ts';

const validate = (schema, value) => schema['~standard'].validate(value);

test('env booleans validate strings without changing native boolean behavior', () => {
  const schema = v.bool();
  for (const [input, output] of [
    ['true', true],
    ['false', false],
    [true, true],
    [false, false],
  ]) {
    deepStrictEqual(validate(schema, input), { value: output });
  }
  for (const input of [undefined, null, '', 'yes', 'TRUE', '0', 0, {}]) {
    deepStrictEqual(validate(schema, input), { issues: [{ message: 'expected_boolean' }] });
  }
});

test('number, timestamp and checkbox coercion remains unchanged', () => {
  deepStrictEqual(validate(v.number(), '3000'), { value: 3000 });
  deepStrictEqual(validate(v.number(), 3000), { value: 3000 });
  for (const input of [undefined, '', 'invalid', NaN, Infinity]) {
    ok(validate(v.number(), input).issues);
  }
  const date = new Date('2026-10-01T00:00:00.000Z');
  for (const input of [date, date.toISOString(), date.valueOf()]) {
    deepStrictEqual(validate(v.timestamp(), input), { value: date });
  }
  ok(validate(v.timestamp(), 'invalid').issues);
  for (const input of ['true', 'on', '1', true, 1]) {
    deepStrictEqual(validate(v.checkbox(), input), { value: true });
  }
  for (const input of ['false', 'off', '0', false, 0, undefined, null]) {
    deepStrictEqual(validate(v.checkbox(), input), { value: false });
  }
});

test('optional, nullable, option and fallback preserve empty-value handling', () => {
  for (const input of [undefined, null, '']) {
    deepStrictEqual(validate(v.optional(v.bool()), input), { value: undefined });
    deepStrictEqual(validate(v.nullable(v.bool()), input), { value: null });
    equal(validate(v.option(v.bool()), input).value.is_none(), true);
    deepStrictEqual(validate(v.fallback(v.number(), 3000), input), { value: 3000 });
  }
  deepStrictEqual(validate(v.optional(v.bool()), 'false'), { value: false });
  deepStrictEqual(validate(v.nullable(v.bool()), 'true'), { value: true });
  equal(validate(v.option(v.bool()), 'true').value.unwrap(), true);
  deepStrictEqual(validate(v.fallback(v.number(), 3000), '8080'), { value: 8080 });
  ok(validate(v.fallback(v.number(), 3000), 'invalid').issues);
});

test('string options, validators and transformers still run', () => {
  deepStrictEqual(validate(v.string({ trim: true, case: 'lower' }), '  HELLO  '), { value: 'hello' });
  deepStrictEqual(validate(v.string({ trim: true, case: 'formal' }), '  JOHN DOE  '), { value: 'John Doe' });
  deepStrictEqual(validate(v.email(), 'USER@EXAMPLE.COM'), { value: 'user@example.com' });
  deepStrictEqual(validate(v.to_lowercase(), 'HELLO'), { value: 'hello' });
  deepStrictEqual(validate(v.to_number(v.literal(['1', '2'])), '2'), { value: 2 });
  deepStrictEqual(validate(v.to_number(v.string()), true), { value: 1 });
  ok(validate(v.string(v.length(2, 5)), 'a').issues);
  ok(validate(v.number(v.minmax(1, 65535)), '0').issues);
});

test('object and list parsing preserve native values, JSON and issue paths', () => {
  const schema = v.object({ enabled: v.bool(), ports: v.list(v.number()) });
  deepStrictEqual(validate(schema, { enabled: true, ports: [3000, '8080'] }), {
    value: { enabled: true, ports: [3000, 8080] },
  });
  deepStrictEqual(validate(schema, '{"enabled":"false","ports":["3000"]}'), {
    value: { enabled: false, ports: [3000] },
  });
  deepStrictEqual(validate(schema, { enabled: 'true', ports: ['invalid'] }), {
    issues: [{ message: 'expected_number', path: ['ports', 0] }],
  });
  const data = new FormData();
  data.set('enabled', 'false');
  data.append('ports[]', '3000');
  deepStrictEqual(v.parse(schema, data).unwrap(), { enabled: false, ports: [3000] });
});

test('parse reports field names without a leading dot', () => {
  const schema = v.object({ name: v.string(v.length(1, 3)), address: v.object({ city: v.string() }) });
  const errors = v.parse(schema, { name: 'too long', address: { city: 1 } }).unwrap_err();
  deepStrictEqual(
    errors.map((error) => error.field),
    ['name', 'address.city'],
  );
});
