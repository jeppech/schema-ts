import * as v from '../src/index.ts';

export function is_in_the_past(err = 'expected a timestamp in the past' as const) {
  return (value: Date, field: string) => {
    const now = new Date();
    if (value > now) {
      return new v.ValidationError(err, value, field);
    }
  };
}

const user_schema = {
  username: v.as(v.string()),
  age: v.as(v.number()),
  email: v.as(v.string(), v.email()),
  ids: v.as(v.array(v.string())),
  created_at: v.as(v.timestamp(), is_in_the_past()),
  deleted: v.as(v.optional(v.timestamp())),
  this_is_nullable: v.as(v.optional(v.string())),
  have_you_heard_about_our_extended_warranty: v.as(v.to_number(v.checkbox()), v.literal(false)),
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

const result = v.parse_formdata(user_schema, form);

if (result.is_err()) {
  // Contains a list of errors
  const errors = result.unwrap_err();
  errors.forEach((err) => console.log(err.field, err.message));
} else {
  // Contains the parsed user object
  const user = result.unwrap();
  console.log(user.created_at.toLocaleDateString());
}
