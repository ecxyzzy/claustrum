import { Arr } from "@/collections/Arr";

abstract class _Validation<T> {
  abstract readonly type: "Valid" | "Invalid";

  abstract match<U>({
    Valid,
    Invalid,
  }: {
    Valid: (x: T) => U;
    Invalid: (xs: Arr<unknown>) => U;
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

class _Invalid<T> extends _Validation<T> {
  readonly type = "Invalid";

  constructor(private readonly es: Arr<unknown>) {
    super();
  }

  match<U>({ Invalid }: { Invalid: (x: Arr<unknown>) => U }): U {
    return Invalid(this.es);
  }
}

/**
 * Represents a valid value, or a sequence of errors explaining why the value
 * was invalid. Does not short-circuit on error, unlike `Either`.
 */
export type Validation<T> = Valid<T> | Invalid<T>;

export type Valid<T> = _Valid<T>;
export type Invalid<T> = _Invalid<T>;

export const Valid = <T>(x: T): Validation<T> => new _Valid(x);
export const Invalid = <T>(...errors: unknown[]): Validation<T> => new _Invalid(Arr(...errors));
