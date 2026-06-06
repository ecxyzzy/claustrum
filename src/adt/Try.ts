abstract class _Try<T> {
  abstract readonly type: "Success" | "Failure";
  abstract match<U>({ Success, Failure }: { Success: (x: T) => U; Failure: (x: unknown) => U }): U;
  abstract failed<E = unknown>(): Try<E>;
  abstract filterOrElse(f: (x: T) => unknown, errorFactory: (x: T) => unknown): Try<T>;
  abstract get(): T;
  abstract isSuccess(): this is Success<T>;
  abstract isFailure(): this is Failure<T>;
  abstract mapFailure<E = unknown>(f: (x: E) => unknown): Try<T>;
}

class _Success<T> extends _Try<T> {
  readonly type = "Success";

  constructor(private readonly v: T) {
    super();
  }

  match<U>({ Success }: { Success: (x: T) => U }) {
    return Success(this.v);
  }

  failed<E = unknown>(): Try<E> {
    return Failure(new TypeError("failed called on instance of Success"));
  }

  filterOrElse(f: (x: T) => unknown, errorFactory: (x: T) => unknown): Try<T> {
    return f(this.v) ? this : Failure(errorFactory(this.v));
  }

  get(): T {
    return this.v;
  }

  isSuccess(): this is Success<T> {
    return true;
  }

  isFailure(): this is Failure<T> {
    return false;
  }

  mapFailure<E = unknown>(_f: (x: E) => unknown): Try<T> {
    return this;
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

  failed<E = unknown>(): Try<E> {
    return Success(this.e as E);
  }

  filterOrElse(_f: (x: T) => unknown, _errorFactory: (x: T) => unknown): Try<T> {
    return this;
  }

  get(): T {
    throw this.e;
  }

  isSuccess(): this is Success<T> {
    return false;
  }

  isFailure(): this is Failure<T> {
    return true;
  }

  mapFailure<E = unknown>(f: (x: E) => unknown): Try<T> {
    try {
      return Failure(f(this.e as E));
    } catch (e) {
      return Failure(e);
    }
  }
}

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

export type Success<T> = _Success<T>;
export type Failure<T> = _Failure<T>;

export const Success = <T>(v: T): Try<T> => new _Success(v);
export const Failure = <T>(e: unknown): Try<T> => new _Failure(e);
