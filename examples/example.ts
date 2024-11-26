import * as v from '../src/index.ts';

export function is_in_the_past(err = 'expected a timestamp in the past') {
  return (value: Date, field: string) => {
    const now = new Date();
    if (value > now) {
      return new v.ValidationError(err, value, field);
    }
  };
}

const userdata = {
  username: v.as(v.string()),
  age: v.as(v.number()),
  email: v.as(v.string(), v.email()),
  created_at: v.as(v.timestamp(), is_in_the_past()),
  deleted: v.as(v.optional(v.timestamp())),
  have_you_heard_about_our_extended_warranty: v.as(v.bool()),
};

type User = v.InferObject<typeof userdata>;

const form = new FormData(); // from a request, eg. `await req.formData()`

const result = v.parse_formdata(form, userdata);

if (result.is_err()) {
  // Contains a list of errors
  const errors = result.unwrap_err();
  errors.forEach((err) => console.log(err.field, err.message));
} else {
  // Contains the parsed user object
  const user = result.unwrap();
  console.log(user.created_at.toLocaleDateString());
}