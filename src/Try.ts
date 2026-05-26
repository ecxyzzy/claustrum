/**
 * Represents a computation that may throw.
 */
export type Try<T> = Success<T> | Failure<T>;
export const Try = <T>(f: () => T): Try<T> => {
  try {
    return Success(f());
  } catch (e) {
    return Failure(e);
  }
};

abstract class _Try<T> {
  abstract readonly type: "Success" | "Failure";
  abstract match<U>({ Success, Failure }: { Success: (x: T) => U; Failure: (x: unknown) => U }): U;
}

class _Success<T> extends _Try<T> {
  readonly type = "Success";

  constructor(private readonly v: T) {
    super();
  }

  match<U>({ Success }: { Success: (x: T) => U }) {
    return Success(this.v);
  }
}

class _Failure<T> extends _Try<T> {
  readonly type = "Failure";

  constructor(private readonly e: unknown) {
    super();
  }

  match<U>({ Failure }: { Failure: (x: unknown) => U }) {
    return Failure(this.e);
  }
}

export type Success<T> = _Success<T>;
export type Failure<T> = _Failure<T>;

export const Success = <T>(v: T): Try<T> => new _Success(v);
export const Failure = <T>(e: unknown): Try<T> => new _Failure(e);
