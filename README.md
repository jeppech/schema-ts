# Validate unknown data
[![npm package version](https://img.shields.io/npm/v/@jeppech/schema-ts)](https://npmjs.com/package/@jeppech/schema-ts)

Small library for creating schemas that validate and assert unknown data.

> someone: Why not use valibot  
> me: We have valibot at home...  
> valibot at home: 👇

## Install
```sh
pnpm add @jeppech/schema-ts
```

## Usage

```ts
import * as v from '@jeppech/schema-ts';

const userdata = {
  username: v.string(),
  display_name: v.string({ trim: true, case: 'formal' }),
  age: v.number(),
  email: v.string(v.email()),
  created_at: v.timestamp(),
  deleted: v.optional(v.timestamp()),
  have_you_heard_about_our_extended_warranty: v.bool(),
};

type User = v.InferObject<typeof userdata>;
/**
 * The `User` type will reflect any changes made to the schema above.
 *
 * type User = {
 *   username: string;
 *   display_name: string;
 *   age: number;
 *   email: string;
 *   created_at: Date;
 *   deleted: Option<Date>;
 *   have_you_heard_about_our_extended_warranty: boolean;
 * }
 */

const form = new FormData(); // from a request, e.g. `await req.formData()`

const result = v.parse(form, userdata);

if (result.is_err()) {
  console.log(result.unwrap_err());
} else {
  const user = result.unwrap();
}
```

## String options

`v.string()` accepts an optional options object before validators:

```ts
v.string({ trim: true, case: 'formal' });
```

Supported case modes:

- `none`
- `lower`
- `upper`
- `formal`

`formal` lowercases the input first, then uppercases the first letter after spaces, dashes, and apostrophes.

### Non-empty strings

`v.string()` accepts empty strings by default. Add `v.non_empty()` to reject `''`:

```ts
v.string(v.non_empty());
```

`non_empty()` does not trim: whitespace-only strings such as `'   '` are still non-empty.
Combine it with `trim: true` to reject whitespace-only input and trim valid strings:

```ts
v.string({ trim: true }, v.non_empty());
// '' and '   ' fail; '  hello  ' becomes 'hello'.

v.string({ trim: true }, v.non_empty('Please enter a name'));
```

Trimming runs before validators. The default validation error is `empty_value`, or you can supply a custom message.
`v.optional(v.string({ trim: true }, v.non_empty()))` treats `''` as absent before validation, but whitespace-only
strings reach the inner schema and fail after trimming.

## SvelteKit environment variables

The built-in string and coercing schemas work directly with SvelteKit's `defineEnvVars`, without an adapter:

```ts
import { defineEnvVars } from '@sveltejs/kit/env';
import * as v from '@jeppech/schema-ts';

export const variables = defineEnvVars({
  FEATURE_ENABLED: { schema: v.bool() },
  PORT: { schema: v.fallback(v.number(v.minmax(1, 65535)), 3000) },
  OPTIONAL_SECRET: { schema: v.optional(v.string()) },
});
```

`bool()` accepts the strings `'true'` and `'false'`. Missing values fail validation unless the schema is wrapped
in `optional()` or `fallback()`. A fallback applies to missing or empty values, not invalid non-empty values.

### Standard Schema input types

Input metadata describes the schema's declared input before conversion; `validate()` still accepts unknown values.
The type declarations require TypeScript 5.4 or newer.
`string()`, `email()`, `number()`, `bool()`, `timestamp()` and `to_lowercase()` declare string inputs by default.
`checkbox()` declares `string | undefined`. Wrappers preserve the inner input type and add `undefined`.
They also continue treating `null` and empty strings as empty at runtime.

Runtime behavior is unchanged: native booleans, numbers and Dates are still supported where they were previously.
To include those values in inferred input types, explicitly choose a broader input:

```ts
v.bool<string | boolean>();
v.number<string | number>();
v.timestamp<string | number | Date>();
v.checkbox<string | boolean | number | null | undefined>();
```

These broader inputs are for general-purpose schemas, not SvelteKit env schemas, whose inputs must be strings or
`undefined`. Literal, list and object schemas infer their inputs from the literals or child schemas.

# Extending
You can add your own valuers and validators. They are just simple functions.

## Valuer
A valuer asserts that the input value is the type we want and returns that type.

If the assertion fails, it must throw a `ValidationError`.

The built-in valuers take a variadic number of validators, which are used to validate the returned value if needed.

Here's an example of a valuer that requires the property to be either `admin`, `user`, or `anonymous`. This could also be made as a validator, but using a valuer returns the concrete type.

```ts
const roles = ['admin', 'user', 'anonymous'] as const;
type UserRole = (typeof roles)[number];

export function role(...validators: v.Validator<UserRole>[]) {
  return (value: unknown, field: string) => {
    if (typeof value === 'string') {
      if (roles.includes(value as UserRole)) {
        return v.validate(value as UserRole, field, ...validators);
      }
    }
    throw new v.ValidationError('expected a valid role', value, field);
  };
}

const user = {
  name: v.string(),
  role: v.role(),
};

type UserWithRole = v.InferObject<typeof user>;
```
See [src/valuers.ts](src/valuers.ts) for more examples


## Validator
A validator is a function that is passed after the main schema argument.

A validator's job is to validate the input data. If validation succeeds, it must return `void` or `undefined`. If it fails, it must return a `ValidationError`.

Because a validator comes after a valuer, it can expect the exact output type from that valuer.

Here's an example of a validator that requires a timestamp to be in the future.
```ts
function in_the_future(err = 'expected a timestamp in the future') {
  return (value: Date, field: string) => {
    const now = new Date();
    if (value < now) {
      return new ValidationError(err, value, field);
    }
  };
}

const notification = {
  message: v.string(),
  fire_at: v.timestamp(in_the_future()),
};

type NotifyInFuture = v.InferObject<typeof notification>;
```
See [src/validators.ts](src/validators.ts) for more examples

# Acknowledgement
[Valibot](https://github.com/fabian-hiller/valibot)
