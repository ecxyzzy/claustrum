abstract class _Either<L, R> {
  abstract readonly type: "Left" | "Right";

  abstract match<U>({ Left, Right }: { Left: (x: L) => U; Right: (x: R) => U }): U;
}

class _Left<L, R> implements _Either<L, R> {
  readonly type = "Left";

  constructor(private readonly v: L) {}

  match<U>({ Left }: { Left: (x: L) => U }): U {
    return Left(this.v);
  }
}

class _Right<L, R> implements _Either<L, R> {
  readonly type = "Right";

  constructor(private readonly v: R) {}

  match<U>({ Right }: { Right: (x: R) => U }): U {
    return Right(this.v);
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
