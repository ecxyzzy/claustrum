import { type Either, Left, Right } from "./Either.ts";
import { Seq } from "./Seq.ts";
import { Failure, Success, type Try } from "./Try.ts";

/**
 * Represents an optional value.
 */
export type Maybe<T> = Just<T> | Nothing<T>;
export const Maybe = <T>(x: T | null | undefined): Maybe<T> =>
  x !== null && x !== undefined ? Just(x) : Nothing;

abstract class _Maybe<T> {
  abstract readonly type: "Just" | "Nothing";
  abstract match<U>({ Just, Nothing }: { Just: (x: T) => U; Nothing: () => U }): U;

  static all<A>(ms: [Maybe<A>]): Maybe<[A]>;
  static all<A, B>(ms: [Maybe<A>, Maybe<B>]): Maybe<[A, B]>;
  static all<A, B, C>(ms: [Maybe<A>, Maybe<B>, Maybe<C>]): Maybe<[A, B, C]>;
  static all(ms: Maybe<unknown>[]): Maybe<unknown[]> {
    return ms.some(m => m.isNothing()) ? Nothing : Just(ms.map(m => m.unwrap()));
  }

  and<U>(that: Maybe<U>): Maybe<U> {
    return this.match({
      Just: () => that,
      Nothing: () => Nothing,
    });
  }

  every(f: (x: T) => unknown): boolean {
    return this.match({
      Just: x => !!f(x),
      Nothing: () => true,
    });
  }

  expect(errLike: string | Error | (() => Error)): T {
    return this.match({
      Just: x => x,
      Nothing: () => {
        switch (typeof errLike) {
          case "string":
            throw new Error(errLike);
          case "object":
            throw errLike;
          case "function":
            throw errLike();
        }
      },
    });
  }

  filter(this: Maybe<T>, f: (x: T) => unknown): Maybe<T> {
    return this.match({
      Just: x => (f(x) ? this : Nothing),
      Nothing: () => Nothing,
    });
  }

  filterNot(this: Maybe<T>, f: (x: T) => unknown): Maybe<T> {
    return this.filter(x => !f(x));
  }

  flatMap<U>(f: (x: T) => Maybe<U>): Maybe<U> {
    return this.match({
      Just: x => f(x),
      Nothing: () => Nothing,
    });
  }

  forEach(f: (x: T) => unknown): void {
    this.match({
      Just: x => f(x),
      Nothing: () => {},
    });
  }

  includes(y: T): boolean {
    return this.some(x => x === y);
  }

  inspect(this: Maybe<T>, f: (x: T) => unknown): Maybe<T> {
    this.forEach(f);
    return this;
  }

  isJust(): this is Just<T> {
    return this.type === "Just";
  }

  isNothing(): this is Nothing<T> {
    return this.type === "Nothing";
  }

  map<U>(f: (x: T) => U | null | undefined): Maybe<U> {
    return this.match({
      Just: x => Maybe(f(x)),
      Nothing: () => Nothing,
    });
  }

  mapOr<U>(val: U, f: (x: T) => U): U {
    return this.match({
      Just: x => f(x),
      Nothing: () => val,
    });
  }

  mapOrElse<U>(g: () => U, f: (x: T) => U): U {
    return this.match({
      Just: x => f(x),
      Nothing: g,
    });
  }

  narrow<U extends T>(f: (x: T) => x is U): Maybe<U> {
    return this.match({
      Just: x => (f(x) ? Maybe(x) : Nothing),
      Nothing: () => Nothing,
    });
  }

  or(this: Maybe<T>, that: Maybe<T>): Maybe<T> {
    return this.match({
      Just: () => this,
      Nothing: () => that,
    });
  }

  orElse(this: Maybe<T>, f: () => Maybe<T>): Maybe<T> {
    return this.match({
      Just: () => this,
      Nothing: f,
    });
  }

  orUndefined(): T | undefined {
    return this.match({
      Just: x => x,
      Nothing: () => undefined,
    });
  }

  some(f: (x: T) => unknown): boolean {
    return this.match({
      Just: x => !!f(x),
      Nothing: () => false,
    });
  }

  unwrap(): T {
    return this.expect("unwrap called on instance of Nothing");
  }

  xor(this: Maybe<T>, that: Maybe<T>): Maybe<T> {
    return this.match({
      Just: () =>
        that.match({
          Just: () => Nothing,
          Nothing: () => this,
        }),
      Nothing: () =>
        that.match({
          Just: () => that,
          Nothing: () => Nothing,
        }),
    });
  }

  zip<U>(that: Maybe<U>): Maybe<[T, U]> {
    return this.match({
      Just: x =>
        that.match({
          Just: y => Just([x, y]),
          Nothing: () => Nothing,
        }),
      Nothing: () => Nothing,
    });
  }

  zipWith<U, V>(that: Maybe<U>, f: (x: T, y: U) => V | null | undefined): Maybe<V> {
    return this.match({
      Just: x =>
        that.match({
          Just: y => Maybe(f(x, y)),
          Nothing: () => Nothing,
        }),
      Nothing: () => Nothing,
    });
  }

  flat<U>(this: Maybe<Maybe<U>>): Maybe<U> {
    return this.flatMap(x => x);
  }

  transpose<L, R>(this: Maybe<Either<L, R>>): Either<L, Maybe<R>> {
    return this.match({
      Just: x =>
        x.match({
          Right: y => Right(Maybe(y)),
          Left: y => Left(y),
        }),
      Nothing: () => Right(Nothing),
    });
  }

  unzip<A, B>(this: Maybe<[A, B]>): [Maybe<A>, Maybe<B>] {
    return this.match({
      Just: ([a, b]) => [Maybe(a), Maybe(b)],
      Nothing: () => [Nothing, Nothing],
    });
  }

  unzip3<A, B, C>(this: Maybe<[A, B, C]>): [Maybe<A>, Maybe<B>, Maybe<C>] {
    return this.match({
      Just: ([a, b, c]) => [Maybe(a), Maybe(b), Maybe(c)],
      Nothing: () => [Nothing, Nothing, Nothing],
    });
  }

  toLeft<R>(r: R): Either<T, R> {
    return this.match({
      Just: x => Left(x),
      Nothing: () => Right(r),
    });
  }

  toRight<L>(l: L): Either<L, T> {
    return this.match({
      Just: x => Right(x),
      Nothing: () => Left(l),
    });
  }

  toSeq(): Seq<T> {
    return this.match({
      Just: x => Seq(x),
      Nothing: Seq,
    });
  }

  toTry<E = unknown>(e: E): Try<T> {
    return this.match({
      Just: Success,
      Nothing: () => Failure(e),
    });
  }
}

Maybe.all = _Maybe.all;

class _Just<T> extends _Maybe<T> {
  readonly type = "Just";

  constructor(private readonly v: NonNullable<T>) {
    super();
  }

  match<U>({ Just }: { Just: (x: T) => U }) {
    return Just(this.v);
  }
}

class _Nothing<T> extends _Maybe<T> {
  readonly type = "Nothing";

  match<U>({ Nothing }: { Nothing: () => U }) {
    return Nothing();
  }
}

export type Just<T> = _Just<T>;
export type Nothing<T> = _Nothing<T>;

export const Just = <T>(x: NonNullable<T>): Maybe<T> => new _Just(x);
export const Nothing: Maybe<never> = new _Nothing();
