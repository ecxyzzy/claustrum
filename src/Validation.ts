import { Seq } from "./Seq.ts";

/**
 * Represents a valid value, or a sequence of errors explaining why the value
 * was invalid. Does not short-circuit on error, unlike `Either`.
 */
export type Validation<T> = Valid<T> | Invalid;

abstract class _Validation<T> {
  abstract readonly type: "Valid" | "Invalid";

  abstract match<U>({
    Valid,
    Invalid,
  }: {
    Valid: (x: T) => U;
    Invalid: (xs: Seq<unknown>) => U;
  }): U;
}

class _Valid<T> extends _Validation<T> {
  readonly type = "Valid";

  constructor(private readonly v: T) {
    super();
  }

  match<U>({ Valid }: { Valid: (x: T) => U }): U {
    return Valid(this.v);
  }
}

class _Invalid extends _Validation<never> {
  readonly type = "Invalid";

  constructor(private readonly es: Seq<unknown>) {
    super();
  }

  match<U>({ Invalid }: { Invalid: (x: Seq<unknown>) => U }): U {
    return Invalid(this.es);
  }
}

export type Valid<T> = _Valid<T>;
export type Invalid = _Invalid;

export const Valid = <T>(x: T): Validation<T> => new _Valid(x);
export const Invalid = (...errors: unknown[]): Validation<never> => new _Invalid(Seq(...errors));
