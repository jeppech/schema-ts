import type { StandardSchemaV1 } from './standard.js';
import type { Schema } from './schemas.js';
import { ValidationError } from './errors.js';

export type Validator<T> = (value: T, field: string) => ValidationError | void;

export type SchemaProperties = {
  [key: string]: Schema;
};

/**
 * Infer the output type from a Schema or SchemaProperties record.
 *
 * `& unknown` is taken from Matts Prettify utility type
 * see https://www.totaltypescript.com/concepts/the-prettify-helper
 */
export type InferObject<T extends SchemaProperties | Schema> =
  T extends Schema<unknown, infer O>
    ? O
    : T extends SchemaProperties
      ? { [K in keyof T]: StandardSchemaV1.InferOutput<T[K]> } & unknown
      : never;

export type InferError<T> = T extends (value: infer P, field: string) => ValidationError<infer U> | undefined
  ? U
  : never;
