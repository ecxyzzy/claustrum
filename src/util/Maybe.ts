import { Dict } from "@/collections/Dict.ts";
import { FSet } from "@/collections/FSet.ts";
import { Seq } from "@/collections/Seq.ts";
import { type Either, Left, Right } from "@/util/Either.ts";
import { Failure, Success, type Try } from "@/util/Try.ts";

/**
 * Represents an optional value.
 */
export type Maybe<T> = Just<T> | Nothing;
export const Maybe = <T>(x: T | null | undefined): Maybe<T> =>
  x !== null && x !== undefined ? Just(x) : Nothing;

abstract class _Maybe<T> {
  abstract readonly type: "Just" | "Nothing";

  /**
   * Pattern match on this `Maybe`.
   *
   * This is the universal catamorphism over the sum type.
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
   * @equiv `this.match({ Just: x => !!f(x), Nothing => true })`
   */
  abstract every(f: (x: T) => unknown): boolean;

  /**
   * Returns the inner value if `this` is `Just`, otherwise throws the provided
   * error-like object.
   *
   * @equiv `this.match({ Just: x => x, Nothing => throw ... })`
   */
  abstract expect(errLike: string | Error | (() => Error)): T;

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

  static all<A>(this: void, ms: [Maybe<A>]): Maybe<[A]>;
  static all<A, B>(this: void, ms: [Maybe<A>, Maybe<B>]): Maybe<[A, B]>;
  static all<A, B, C>(this: void, ms: [Maybe<A>, Maybe<B>, Maybe<C>]): Maybe<[A, B, C]>;
  static all(this: void, ms: Maybe<unknown>[]): Maybe<unknown[]> {
    return ms.some(m => m.isNothing()) ? Nothing : Just(ms.map(m => m.unwrap()));
  }

  inspect(this: Maybe<T>, f: (x: T) => unknown): Maybe<T> {
    this.forEach(f);
    return this;
  }

  isJust(): this is Just<T> {
    return this.type === "Just";
  }

  isNothing(): this is Nothing {
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

  match<U>({ Just }: { Just: (x: T) => U }) {
    return Just(this.v);
  }

  and<U>(that: Maybe<U>) {
    return that;
  }

  every(f: (x: T) => unknown) {
    return !!f(this.v);
  }

  expect() {
    return this.v;
  }

  filter(f: (x: T) => unknown) {
    return f(this.v) ? this : Nothing;
  }

  filterNot(f: (x: T) => unknown) {
    return f(this.v) ? Nothing : this;
  }

  flatMap<U>(f: (x: T) => Maybe<U>) {
    return f(this.v);
  }

  forEach(f: (x: T) => unknown) {
    f(this.v);
  }

  includes(y: T): boolean {
    return this.v === y;
  }
}

class _Nothing extends _Maybe<never> {
  readonly type = "Nothing";

  match<U>({ Nothing }: { Nothing: () => U }) {
    return Nothing();
  }

  and() {
    return Nothing;
  }

  every() {
    return true;
  }

  expect(errLike: string | Error | (() => Error)): never {
    switch (typeof errLike) {
      case "string":
        throw new Error(errLike);
      case "object":
        throw errLike;
      case "function":
        throw errLike();
    }
  }

  filter() {
    return Nothing;
  }

  filterNot() {
    return Nothing;
  }

  flatMap() {
    return Nothing;
  }

  forEach() {}

  includes() {
    return false;
  }
}

export type Just<T> = _Just<T>;
export type Nothing = _Nothing;

export const Just = <T>(x: NonNullable<T>): Maybe<T> => new _Just(x);
export const Nothing: Maybe<never> = new _Nothing();
