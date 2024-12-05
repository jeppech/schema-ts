# Validate unknown data
[![npm package version](https://img.shields.io/npm/v/@jeppech/schema-ts)](https://npmjs.com/package/@jeppech/schema-ts)

Small library for creating schemas, that can validate and assert unknown data.

> someone: Why not use valibot  
> me: We have valibot at home...  
> valibot at home:

## Install
```sh
pnpm add @jeppech/validate-ts
```

## Usage

```ts
import * as v from '@jeppech/schema-ts'

const userdata = {
  username: v.as(v.string()),
  age: v.as(v.number()),
  email: v.as(v.string(), v.email()),
  created_at: v.as(v.timestamp()),
  deleted: v.as(v.optional(v.timestamp())),
  have_you_heard_about_our_extended_warranty: v.as(v.bool())
}

type User = v.InferObject<typeof userdata>
/**
 * The `User` type will have the following shape, and
 * will following any changes made to the object above.
 * 
 * type User = {
 *   username: string;
 *   age: number;
 *   email: string;
 *   created_at: Date;
 *   deleted: Option<Date>;
 *   have_you_heard_about_our_extended_warranty: boolean;
 * } 
 */

const form = new FormData() // from a request, eg. `await req.formData()`

const result = v.parse_formdata(form, userdata)

if (result.is_err()) {
  // Contains a list of errors, WIP
  console.log(result.unwrap_err())
} else {
  // Returns the `User` object
  const user = result.unwrap()
}
```

# Extending
You can add your own `Valuers` and `Validators`, they are just simple functions.

## Valuer
A `Valuer` is a function, that is passed as the first argument to the `v.as(...)` function.
The Valuers job, is to assert, that the input value is of the type that we want, and return that type.
If this assertion fails, it must throw a `ValidationError`.

Here's an example of a Valuer, that requires the property to be either `admin`, `user` or `anonymous`
```ts
const roles = ['admin', 'user', 'anonymous'] as const;
type UserRole = typeof roles[number]

export function role(err = 'expected a valid role') {
  return (value: unknown, field: string) => {
    if (typeof value === 'string') {
      if (roles.includes(value as UserRole)) {
        return value as UserRole;
      }
    }
    throw new ValidationError(err, value, field);
  };
}

const user = {
  name: v.as(v.string()),
  role: v.as(v.role())
}

type UserWithRole = v.InferObject<typeof user>
```
See [src/valuers.ts](src/valuers.ts) for more examples


## Validator
A `Validator` is a function, that is passed as any other argument, besides the first, to the `v.as(...)` function.

A Validators job is, as the name implies, to validate the input data. If a validation succeeds it must return `void`/`undefined`. If it fails, it must return a ValidationError.

As a Validator comes __after__ a Valuer, we can expect an exact type as input data, for the function.

Here's an example of a Validator, that requires a timestamp to be in the future
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
  message: v.as(v.string()),
  fire_at: v.as(v.timestamp(), in_the_future())
}

type NotifyInFuture = v.InferObject<typeof notification>
```
See [src/validators.ts](src/validators.ts) for more examples

# Acknowledgement
[Valibot](https://github.com/fabian-hiller/valibot)
