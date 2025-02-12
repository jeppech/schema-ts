import type { Option } from '@jeppech/results-ts';
import { ValidationError } from './errors.js';

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

export type Valuer = (value: unknown, field: string) => unknown;
export type Validator<T> = (value: T, field: string) => ValidationError | undefined;

export type InferValue<T extends Valuer, K = unknown> = T extends (val: unknown, field: string) => infer U
  ? K extends undefined
    ? Option<U>
    : K extends null
      ? U | null
      : U
  : never;

export type Newable = new (...args: unknown[]) => unknown;
export type InferInstance<T extends Newable> = T extends new (...args: unknown[]) => infer U ? U : never;
