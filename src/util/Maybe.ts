import { Dict } from "@/collections/Dict";
import { FSet } from "@/collections/FSet";
import { Seq } from "@/collections/Seq";
import { type Either, Left, Right } from "@/util/Either";
import { Failure, Success, type Try } from "@/util/Try";

/**
 * Represents an optional value.
 */
export type Maybe<T> = Just<T> | Nothing<T>;
/**
 * Constructs a new `Maybe` instance. Returns `Just` containing the provided
 * value if it is not nullish, otherwise returns `Nothing`.
 */
export const Maybe = <T>(x: T | null | undefined): Maybe<T> =>
  x !== null && x !== undefined ? Just(x) : Nothing;

abstract class _Maybe<T> {
  abstract readonly type: "Just" | "Nothing";

  /**
   * Pattern match on this `Maybe`.
   *
   * This is the universal catamorphism over the sum type. All operations on
   * `Maybe` may be written in terms of `this.match`.
   */
  abstract match<U>({ Just, Nothing }: { Just: (x: T) => U; Nothing: () => U }): U;

  /**
   * Returns `Nothing` if `this` is `Nothing`, otherwise returns `that`.
   *
   * @equiv `this.match({ Just: _ => that, Nothing: () => Nothing })`
   */
  abstract and<U>(that: Maybe<U>): Maybe<U>;

  /**
   * Returns `true` if `this` is `Nothing` or if the inner value matches the
   * provided predicate.
   *
   * This is the universal quantifier (`\forall`).
   *
   * @equiv `this.match({ Just: x => !!f(x), Nothing => true })`
   */
  abstract every(f: (x: T) => unknown): boolean;

  /**
   * Returns the inner value if `this` is `Just`, otherwise throws the provided
   * error-like object.
   *
   * @equiv `this.match({ Just: x => x, Nothing => throw ... })`
   */
  abstract expect(errLike: string | Error | (() => Error)): NonNullable<T>;

  /**
   * Returns `this` if `this` is `Just` and the inner value matches the provided
   * predicate, otherwise returns `Nothing`.
   *
   * @equiv `this.match({ Just: x => (f(x) ? this : Nothing), Nothing: () => Nothing })`
   */
  abstract filter(f: (x: T) => unknown): Maybe<T>;

  /**
   * Returns `this` if `this` is `Just` and the inner value does not match the
   * provided predicate, otherwise returns `Nothing`.
   *
   * @equiv `this.match({ Just: x => (f(x) ? Nothing : this), Nothing: () => Nothing })`
   */
  abstract filterNot(f: (x: T) => unknown): Maybe<T>;

  /**
   * Returns the provided function applied to the inner value if `this` is
   * `Just`, otherwise returns `Nothing`.
   *
   * This is monadic bind (`>>=`).
   *
   * @equiv `this.match({ Just: x => f(x), Nothing: () => Nothing })`
   */
  abstract flatMap<U>(f: (x: T) => Maybe<U>): Maybe<U>;

  /**
   * Runs the provided side-effectful function on the inner value if `this` is
   * `Just`, otherwise does nothing. Consumes the `Maybe` in the process.
   *
   * @equiv `this.match({ Just: x => f(x), Nothing: () => {} })`
   */
  abstract forEach(f: (x: T) => unknown): void;

  /**
   * Returns `true` if `this` is `Just` and the inner value is equal to the
   * provided value, otherwise returns `false`.
   *
   * @equiv `this.match({ Just: x => x === y, Nothing: () => false })`
   */
  abstract includes(y: T): boolean;

  /**
   * Runs the provided side-effectful function on the inner value if `this` is
   * `Just`, otherwise does nothing. Returns the same `Maybe` after `f` is done.
   */
  abstract inspect(f: (x: T) => unknown): Maybe<T>;

  /**
   * Returns `true` if `this` is `Just`.
   *
   * @equiv `this.match({ Just: _ => true, Nothing: () => false })`
   */
  abstract isJust(): boolean;

  /**
   * Returns `true` if `this` is `Nothing`.
   *
   * @equiv `this.match({ Just: _ => false, Nothing: () => true })`
   */
  abstract isNothing(): boolean;

  /**
   * If `this` is `Just`, returns a new `Maybe` wrapping the value of the
   * function applied to the inner value, otherwise returns `Nothing`.
   *
   * This is functorial `fmap`.
   *
   * @equiv `this.match({ Just: x => Maybe(f(x)), Nothing: () => Nothing })`
   */
  abstract map<U>(f: (x: T) => U | null | undefined): Maybe<U>;

  /**
   * If `this` is `Just`, returns the function applied to the inner value,
   * otherwise returns the alternative value.
   *
   * @equiv `this.match({ Just: x => f(x), Nothing: () => y })`
   */
  abstract mapOr<U>(y: U, f: (x: T) => U): U;

  /**
   * Converts a tuple of `Maybe` instances to a `Maybe` of a tuple. If any
   * element in the tuple is `Nothing`, returns `Nothing`; otherwise, returns a
   * `Just` containing a tuple of all unwrapped elements.
   *
   * This is `sequence` on `Traversable`, implemented on the effect `Maybe`.
   */
  static all<A>(this: void, ms: [Maybe<A>]): Maybe<[A]>;
  static all<A, B>(this: void, ms: [Maybe<A>, Maybe<B>]): Maybe<[A, B]>;
  static all<A, B, C>(this: void, ms: [Maybe<A>, Maybe<B>, Maybe<C>]): Maybe<[A, B, C]>;
  static all(this: void, ms: Maybe<unknown>[]): Maybe<unknown[]> {
    return ms.some(m => m.isNothing()) ? Nothing : Just(ms.map(m => m.unwrap()));
  }

  /**
   * Converts a tuple of `Maybe` instances to a `Maybe` of a tuple. If any
   * element in the tuple is `Nothing`, returns `Nothing`; otherwise, returns a
   * `Just` containing the value of the function applied to a tuple of all
   * unwrapped values.
   *
   * This is `traverse` on `Traversable`, implemented on the effect `Maybe`.
   */
  static allWith<A, A1>(this: void, ms: [Maybe<A>], f: (x: [A]) => [A1]): Maybe<[A1]>;
  static allWith<A, B, A1, B1>(
    this: void,
    ms: [Maybe<A>, Maybe<B>],
    f: (x: [A, B]) => [A1, B1],
  ): Maybe<[A1, B1]>;
  static allWith<A, B, C, A1, B1, C1>(
    this: void,
    ms: [Maybe<A>, Maybe<B>, Maybe<C>],
    f: (x: [A, B, C]) => [A1, B1, C1],
  ): Maybe<[A1, B1, C1]>;
  static allWith(this: void, ms: Maybe<unknown>[], f: (x: any) => unknown[]): Maybe<unknown[]> {
    return ms.some(m => m.isNothing()) ? Nothing : Just(f(ms.map(m => m.unwrap())));
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

  toDictAsKey<V>(v: V): Dict<T, V> {
    return this.match({
      Just: x => Dict([x, v]),
      Nothing: () => Dict(),
    });
  }

  toDictAsValue<K>(k: K): Dict<K, T> {
    return this.match({
      Just: x => Dict([k, x]),
      Nothing: () => Dict(),
    });
  }

  toFSet(): FSet<T> {
    return this.match({
      Just: x => FSet(x),
      Nothing: FSet,
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

  match<U>({ Just }: { Just: (x: T) => U }): U {
    return Just(this.v);
  }

  and<U>(that: Maybe<U>): Maybe<U> {
    return that;
  }

  every(f: (x: T) => unknown): boolean {
    return !!f(this.v);
  }

  expect(): NonNullable<T> {
    return this.v;
  }

  filter(f: (x: T) => unknown): Maybe<T> {
    return f(this.v) ? this : Nothing;
  }

  filterNot(f: (x: T) => unknown): Maybe<T> {
    return f(this.v) ? Nothing : this;
  }

  flatMap<U>(f: (x: T) => Maybe<U>): Maybe<U> {
    return f(this.v);
  }

  forEach(f: (x: T) => unknown): void {
    f(this.v);
  }

  includes(y: T): boolean {
    return this.v === y;
  }

  inspect(f: (x: T) => unknown): Maybe<T> {
    this.forEach(f);
    return this;
  }

  isJust(): this is Just<T> {
    return true;
  }

  isNothing(): this is Nothing<T> {
    return false;
  }

  map<U>(f: (x: T) => U | null | undefined): Maybe<U> {
    return Maybe(f(this.v));
  }

  mapOr<U>(_y: U, f: (x: T) => U): U {
    return f(this.v);
  }
}

class _Nothing<T> extends _Maybe<T> {
  readonly type = "Nothing";

  match<U>({ Nothing }: { Nothing: () => U }): U {
    return Nothing();
  }

  and<U>(): Maybe<U> {
    return Nothing;
  }

  every(): boolean {
    return true;
  }

  expect(errLike: string | Error | (() => Error)): NonNullable<T> {
    switch (typeof errLike) {
      case "string":
        throw new Error(errLike);
      case "object":
        throw errLike;
      case "function":
        throw errLike();
    }
  }

  filter(): Maybe<T> {
    return Nothing;
  }

  filterNot(): Maybe<T> {
    return Nothing;
  }

  flatMap<U>(): Maybe<U> {
    return Nothing;
  }

  forEach(): void {}

  includes(): boolean {
    return false;
  }

  inspect(): Maybe<T> {
    return Nothing;
  }

  isJust(): this is Just<T> {
    return false;
  }

  isNothing(): this is Nothing<T> {
    return true;
  }

  map<U>(): Maybe<U> {
    return Nothing;
  }

  mapOr<U>(y: U): U {
    return y;
  }
}

export type Just<T> = _Just<T>;
export type Nothing<T> = _Nothing<T>;

export const Just = <T>(x: NonNullable<T>): Maybe<T> => new _Just(x);
export const Nothing: Maybe<never> = new _Nothing();
