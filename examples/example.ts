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

const user_schema = {
  username: v.string(),
  age: v.number(),
  email: v.string(v.email()),
  ids: v.array(v.string()),
  created_at: v.timestamp(is_in_the_past()),
  admin: v.fallback(v.bool(), false),
  deleted: v.optional(v.timestamp()),
  this_is_nullable: v.nullable(v.string()),
  is_remote: v.optional(v.bool()),
  have_you_heard_about_our_extended_warranty: v.to_number(v.checkbox(v.literal(false))),
  role: v.schema(role_schema),
};

type User = v.InferObject<typeof user_schema>;

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

const result = v.parse(user_schema, form);

if (result.is_err()) {
  // Contains a list of errors
  const errors = result.unwrap_err();
  errors.forEach((err) => console.log(err.field, err.message));
} else {
  // Contains the parsed user object
  const user = result.unwrap();
  console.log(JSON.stringify(user, null, 2));
}
