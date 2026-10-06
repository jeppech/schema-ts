import type { StandardSchemaV1 } from '@standard-schema/spec';
import type { Option } from '@jeppech/results-ts';
import * as v from '@jeppech/schema-ts';

type Equal<T, U> = (<K>() => K extends T ? 1 : 2) extends <K>() => K extends U ? 1 : 2 ? true : false;
type Assert<T extends true> = T;

// SvelteKit's env schema constraint, using the official Standard Schema package.
type EnvVarConfig<T> = {
  public?: boolean;
  static?: boolean;
  schema?: StandardSchemaV1<string | undefined, T> | ((value: string | undefined) => T | undefined);
};

declare function defineEnvVars<T extends Record<string, EnvVarConfig<unknown>>>(variables: T): T;

const variables = defineEnvVars({
  API_URL: { schema: v.string() },
  EMAIL: { schema: v.email() },
  FEATURE_ENABLED: { schema: v.bool() },
  SHOW_OVERLAY: { schema: v.checkbox(), public: true, static: true },
  PORT: { schema: v.fallback(v.number(v.minmax(1, 65535)), 3000) },
  OPTIONAL_PORT: { schema: v.optional(v.number()) },
  OPTIONAL_FEATURE: { schema: v.optional(v.bool()) },
  NULLABLE_FEATURE: { schema: v.nullable(v.bool()) },
  OPTION_FEATURE: { schema: v.option(v.bool()) },
  LAUNCH_DATE: { schema: v.timestamp() },
  LOG_LEVEL: { schema: v.literal(['debug', 'info', 'error']) },
  LOWERCASE: { schema: v.to_lowercase() },
  NORMALIZED: { schema: v.string({ trim: true, case: 'lower' }, v.length(1, 100)) },
  NUMERIC_LITERAL: { schema: v.to_number(v.literal(['1', '2'])) },
  NESTED: { schema: v.fallback(v.optional(v.bool()), false) },
  FUNCTION_PORT: { schema: (value) => (value === undefined ? 3000 : Number(value)) },
});

type BooleanOutput = Assert<Equal<StandardSchemaV1.InferOutput<typeof variables.FEATURE_ENABLED.schema>, boolean>>;
type NumberOutput = Assert<Equal<StandardSchemaV1.InferOutput<typeof variables.PORT.schema>, number>>;
type OptionalOutput = Assert<
  Equal<StandardSchemaV1.InferOutput<typeof variables.OPTIONAL_PORT.schema>, number | undefined>
>;
type NullableOutput = Assert<
  Equal<StandardSchemaV1.InferOutput<typeof variables.NULLABLE_FEATURE.schema>, boolean | null>
>;
type OptionOutput = Assert<
  Equal<StandardSchemaV1.InferOutput<typeof variables.OPTION_FEATURE.schema>, Option<boolean>>
>;
type DateOutput = Assert<Equal<StandardSchemaV1.InferOutput<typeof variables.LAUNCH_DATE.schema>, Date>>;
type LiteralOutput = Assert<
  Equal<StandardSchemaV1.InferOutput<typeof variables.LOG_LEVEL.schema>, 'debug' | 'info' | 'error'>
>;
type DefaultInput = Assert<Equal<StandardSchemaV1.InferInput<typeof variables.FEATURE_ENABLED.schema>, string>>;
type OptionalInput = Assert<
  Equal<StandardSchemaV1.InferInput<typeof variables.OPTIONAL_PORT.schema>, string | undefined>
>;

const native_boolean = v.bool<string | boolean>();
const native_number = v.number<string | number>();
const native_date = v.timestamp<string | number | Date>();
const native_checkbox = v.checkbox<string | number | boolean | null | undefined>();
const native_optional = v.optional(native_boolean);
type NativeBooleanInput = Assert<Equal<StandardSchemaV1.InferInput<typeof native_boolean>, string | boolean>>;
type NativeNumberInput = Assert<Equal<StandardSchemaV1.InferInput<typeof native_number>, string | number>>;
type NativeDateInput = Assert<Equal<StandardSchemaV1.InferInput<typeof native_date>, string | number | Date>>;
type NativeCheckboxInput = Assert<
  Equal<StandardSchemaV1.InferInput<typeof native_checkbox>, string | number | boolean | null | undefined>
>;
type NativeOptionalInput = Assert<
  Equal<StandardSchemaV1.InferInput<typeof native_optional>, string | boolean | undefined>
>;

const struct = {
  name: v.string(),
  enabled: v.bool(),
  ports: v.list(v.number()),
};
const object_schema = v.object(struct);
type ObjectInput = Assert<
  Equal<StandardSchemaV1.InferInput<typeof object_schema>, { name: string; enabled: string; ports: string[] }>
>;
type ObjectOutput = Assert<
  Equal<StandardSchemaV1.InferOutput<typeof object_schema>, { name: string; enabled: boolean; ports: number[] }>
>;
type InferredObject = Assert<Equal<v.InferObject<typeof object_schema>, v.InferObject<typeof struct>>>;

// Existing general-purpose consumers still accept the more precise schemas.
const generic_schema: v.Schema<unknown, boolean> = v.bool();
v.parse(object_schema, { name: 'test', enabled: true, ports: [3000] });

// Broader input types must not silently become env-compatible.
// @ts-expect-error Native boolean inputs aren't environment variable inputs.
const invalid_env: StandardSchemaV1<string | undefined, boolean> = native_boolean;
// @ts-expect-error Boolean schemas cannot advertise Date input.
v.bool<Date>();
// @ts-expect-error Boolean output inference must not be widened or lost.
const invalid_output: StandardSchemaV1<string | undefined, string> = variables.FEATURE_ENABLED.schema;

// @ts-expect-error Contextual typing must not override the default string input.
const contextual_boolean: StandardSchemaV1<boolean, boolean> = v.bool();
