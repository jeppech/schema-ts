import type { Option } from '@jeppech/results-ts';

export type SchemaProperties = {
  [key: string]: Valuer;
};
/**
 * Infer the object keys and value types, prettified.
 * `& unknown` is taken from Matts Prettify utility type
 * see https://www.totaltypescript.com/concepts/the-prettify-helper
 */
export type InferObject<T extends SchemaProperties> = {
  [K in keyof T]: InferValue<T[K]>;
} & unknown;

export type Valuer = (value: unknown) => unknown;
export type Validator<T> = (value: T) => string | undefined;

export type Newable = new (...args: unknown[]) => unknown;

export type InferInstance<T extends Newable> = T extends new (...args: unknown[]) => infer U ? U : never;
export type InferValue<T extends Valuer, K = unknown> = T extends (val: unknown) => infer U
  ? K extends undefined
    ? Option<U>
    : U
  : never;
