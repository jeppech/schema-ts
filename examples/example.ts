import * as v from '../src/index.ts';

export function is_in_the_past() {
  return (value: Date, field: string) => {
    const now = new Date();
    if (value > now) {
      return new v.ValidationError('expected a timestamp in the past', value, field);
    }
  };
}

const role_schema = {
  id: v.string(),
  name: v.string(),
};

const user_schema = v.object({
  username: v.string(),
  age: v.number(),
  email: v.email(),
  ids: v.list(v.string(), v.length(1, 2)),
  created_at: v.timestamp(is_in_the_past()),
  admin: v.fallback(v.bool(), false),
  deleted: v.optional(v.timestamp()),
  this_is_nullable: v.nullable(v.string()),
  is_remote: v.optional(v.bool()),
  have_you_heard_about_our_extended_warranty: v.to_number(v.checkbox(v.exactly(false))),
  role: v.object(role_schema),
  roles: v.literal(['admin', 'user']),
});

type User = v.InferObject<typeof user_schema>;

console.log(user_schema);

const json_data = {
  username: 'jeppech',
  age: 35,
  email: 'der@die.das',
  ids: ['1', 'number'],
  created_at: new Date().toISOString(),
  deleted: new Date().toISOString(),
  role: {
    id: 'admin',
    name: 'Jeppe',
  },
  roles: 'user',
};

const json_result = v.parse(user_schema, json_data);

if (json_result.is_err()) {
  const errors = json_result.unwrap_err();
  errors.forEach((err) => console.log(err.field, err.message));
} else {
  console.log(json_result.unwrap());
}

const form = new FormData(); // from a request, eg. `await req.formData()`
form.append('username', 'jeppech');
form.append('age', '35');
form.append('email', 'der@die.das');
form.append('ids[]', '1');
form.append('ids[]', 'number');
form.append('created_at', new Date().toISOString());
form.append('deleted', new Date().toISOString());
// form.append('this_is_nullable', 'hello');
form.append('have_you_heard_about_our_extended_warranty', 'false');
form.append('role', JSON.stringify({ id: 'admin', name: 'Administrator' }));
form.append('roles', 'admin');

const result = v.parse(user_schema, form);

if (result.is_err()) {
  // Contains a list of errors
  const errors = result.unwrap_err();
  errors.forEach((err) => console.log(err.field, err.message));
} else {
  // Contains the parsed user object
  console.log(result.unwrap());
}
