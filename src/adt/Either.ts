import { TaskEither } from "@/concurrent/TaskEither";

abstract class _Either<L, R> {
  abstract readonly type: "Left" | "Right";

  abstract match<T>({ Left, Right }: { Left: (x: L) => T; Right: (x: R) => T }): T;
  abstract flatMap<S>(f: (x: R) => Either<L, S>): Either<L, S>;
  abstract isLeft(): this is Left<L, R>;
  abstract isRight(): this is Right<L, R>;
  abstract swap(): Either<R, L>;
  abstract unwrap(): R;

  liftTask(this: Either<L, R>): TaskEither<L, R> {
    return TaskEither(() => this);
  }
}

class _Left<L, R> extends _Either<L, R> {
  readonly type = "Left";

  constructor(private readonly v: L) {
    super();
  }

  match<T>({ Left }: { Left: (x: L) => T }): T {
    return Left(this.v);
  }

  flatMap<S>(_f: (x: R) => Either<L, S>): Either<L, S> {
    return Left(this.v);
  }

  isLeft(): this is Left<L, R> {
    return true;
  }

  isRight(): this is Right<L, R> {
    return false;
  }

  swap(): Either<R, L> {
    return Right(this.v);
  }

  unwrap(): R {
    throw new TypeError("unwrap called on instance of Left");
  }
}

class _Right<L, R> extends _Either<L, R> {
  readonly type = "Right";

  constructor(private readonly v: R) {
    super();
  }

  match<T>({ Right }: { Right: (x: R) => T }): T {
    return Right(this.v);
  }

  flatMap<S>(f: (x: R) => Either<L, S>): Either<L, S> {
    return f(this.v);
  }

  isLeft(): this is Left<L, R> {
    return false;
  }

  isRight(): this is Right<L, R> {
    return true;
  }

  swap(): Either<R, L> {
    return Left(this.v);
  }

  unwrap(): R {
    return this.v;
  }
}

/**
 * Represents a right-biased disjoint union.
 */
export type Either<L, R> = Left<L, R> | Right<L, R>;

export type Left<L, R> = _Left<L, R>;
export type Right<L, R> = _Right<L, R>;

export const Left = <L, R>(x: L): Either<L, R> => new _Left(x);
export const Right = <L, R>(x: R): Either<L, R> => new _Right(x);
