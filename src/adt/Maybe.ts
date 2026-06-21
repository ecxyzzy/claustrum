import { type Either, Left, Right } from "@/adt/Either";
import type { Nullable } from "@/adt/Nullable";
import { Seq } from "@/collections/Seq";
import { TaskMaybe } from "@/concurrent/TaskMaybe";

/**
 * This is a really stupid hack, but in order to properly support the `Nothing`
 * case of variadic `Maybe.unzip`, we need to make sure the "tuple" is populated
 * with as many `Nothing`s as the maximum arity we support. This is to ensure
 * that when a consumer destructures the result, none of the elements are
 * `undefined`.
 *
 * If you update `Maybe.unzip` to support higher-arity tuples, update this
 * constant to reflect the new maximum arity.
 */
const UNZIP_MAX_ARITY = 4;

abstract class _Maybe<T> {
  abstract readonly type: "Just" | "Nothing";

  /**
   * Pattern match on this `Maybe`.
   *
   * This is the universal catamorphism over the sum type. All operations on
   * `Maybe` may be written in terms of `this.match`.
   */
  abstract match<U>({ Just, Nothing }: { Just: (x: T) => U; Nothing: () => U }): U;

  // region Derived abstract operations

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
   * @equiv `this.match({ Just: x => !!f(x), Nothing: () => true })`
   */
  abstract every(f: (x: T) => unknown): boolean;

  /**
   * Returns the inner value if `this` is `Just`, otherwise throws the provided
   * error-like object.
   *
   * @equiv `this.match({ Just: x => x, Nothing: () => { throw ... } })`
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
   *
   * @equiv `this.match({ Just: x => { f(x); return this; }, Nothing: () => this })`
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
   * This is functorial `fmap`, with the caveat that nullish return values
   * result in `Nothing`.
   *
   * @equiv `this.match({ Just: x => Maybe(f(x)), Nothing: () => Nothing })`
   */
  abstract map<U>(f: (x: T) => Nullable<U>): Maybe<U>;

  /**
   * If `this` is `Just`, returns the function applied to the inner value,
   * otherwise returns the alternative value.
   *
   * @equiv `this.match({ Just: x => f(x), Nothing: () => y })`
   */
  abstract mapOr<U>(y: U, f: (x: T) => U): U;

  /**
   * If `this` is `Just`, returns the function applied to the inner value,
   * otherwise returns the result of the alternative function.
   *
   * @equiv `this.match({ Just: x => f(x), Nothing: () => g() })`
   */
  abstract mapOrElse<U>(g: () => U, f: (x: T) => U): U;

  /**
   * Returns a new `Maybe` containing the narrowed inner value if `this` is
   * `Just` and the inner value matches the provided predicate, otherwise
   * returns `Nothing`.
   *
   * @equiv `this.match({ Just: x => (f(x) ? Maybe(x) : Nothing), Nothing: () => Nothing })`
   */
  abstract narrow<U extends T>(f: (x: T) => x is U): Maybe<U>;

  /**
   * If `this` is `Just`, returns `this`, otherwise returns the other `Maybe`.
   *
   * @equiv `this.match({ Just: _ => this, Nothing: () => that })`
   */
  abstract or(that: Maybe<T>): Maybe<T>;

  /**
   * If `this` is `Just`, returns `this`, otherwise returns the result of the
   * alternative function.
   *
   * @equiv `this.match({ Just: _ => this, Nothing: () => f() })`
   */
  abstract orElse(f: () => Maybe<T>): Maybe<T>;

  /**
   * Returns the inner value if `this` is `Just`, otherwise returns `null`.
   *
   * This is an explicit escape hatch back into TypeScript nullability. It is
   * mostly interchangeable with {@link orUndefined}, but can be useful if you
   * need the value `null`.
   *
   * @equiv `this.match({ Just: x => x, Nothing: () => null })`
   */
  abstract orNull(): T | null;

  /**
   * Returns the inner value if `this` is `Just`, otherwise returns `undefined`.
   *
   * This is an explicit escape hatch back into TypeScript nullability. It is
   * mostly interchangeable with {@link orNull}, but can be useful if you need
   * the value `undefined`.
   *
   * @equiv `this.match({ Just: x => x, Nothing: () => undefined })`
   */
  abstract orUndefined(): T | undefined;

  /**
   * Returns `true` if `this` is `Nothing` and the inner value matches the
   * provided predicate.
   *
   * This is the existential quantifier (`\exists`).
   *
   * @equiv `this.match({ Just: x => !!f(x), Nothing: () => false })`
   */
  abstract some(f: (x: T) => unknown): boolean;

  /**
   * Returns the inner value is `this` is `Just`, otherwise throws.
   *
   * This is {@link expect} with a preset error message.
   */
  abstract unwrap(): NonNullable<T>;

  /**
   * If `this` is `Just` and `that` is `Nothing`, returns `this`; if `this` is
   * `Nothing` and `that` is `Just`, returns `that`; otherwise returns `Nothing`.
   *
   * @equiv `this.match({ Just: _ => that.match({ Just: _ => Nothing, Nothing: () => this }), Nothing: () => that.match({ Just: _ => that, Nothing: () => Nothing }) })`
   */
  abstract xor(that: Maybe<T>): Maybe<T>;

  // endregion

  // region Variadic operations

  /**
   * Converts a `Maybe` containing a tuple of variable arity into a tuple of
   * `Maybes`.
   *
   * This is the dual of {@link zip}.
   */
  unzip<A, B>(this: Maybe<[Nullable<A>, Nullable<B>]>): [Maybe<A>, Maybe<B>];
  unzip<A, B, C>(
    this: Maybe<[Nullable<A>, Nullable<B>, Nullable<C>]>,
  ): [Maybe<A>, Maybe<B>, Maybe<C>];
  unzip<A, B, C, D>(
    this: Maybe<[Nullable<A>, Nullable<B>, Nullable<C>, Nullable<D>]>,
  ): [Maybe<A>, Maybe<B>, Maybe<C>, Maybe<D>];
  unzip(this: Maybe<unknown[]>): Maybe<unknown>[] {
    return this.match({
      Just: xs => xs.map(Maybe),
      Nothing: () => [...Array(UNZIP_MAX_ARITY)].map(_ => Nothing),
    });
  }

  /**
   * Converts an arbitrary number of `Maybe` instances to a `Maybe` of a tuple.
   * If any element in the tuple is `Nothing`, returns `Nothing`; otherwise,
   * returns a `Just` containing a tuple of all unwrapped elements.
   *
   * This is the dual of {@link unzip}.
   */
  zip<T1>(that: Maybe<T1>): Maybe<[T, T1]>;
  zip<T1, T2>(that: Maybe<T1>, that2: Maybe<T2>): Maybe<[T, T1, T2]>;
  zip<T1, T2, T3>(that: Maybe<T1>, that2: Maybe<T2>, that3: Maybe<T3>): Maybe<[T, T1, T2, T3]>;
  zip(this: Maybe<T>, ...thats: Maybe<unknown>[]): Maybe<unknown[]> {
    const ms = [this, ...thats];
    return ms.some(Maybe.isNothing) ? Nothing : Just(ms.map(Maybe.unwrap));
  }

  /**
   * Converts an arbitrary number of `Maybe` instances into a single `Maybe`. If
   * any element in the tuple is `Nothing`, returns `Nothing`; otherwise,
   * returns a `Just` containing the provided function called with all unwrapped
   * elements provided in order.
   */
  zipWith<T1, TOut>(f: (x: T1) => Nullable<TOut>, that: Maybe<T1>): Maybe<TOut>;
  zipWith<T1, T2, TOut>(
    f: (x: T1, y: T2) => Nullable<TOut>,
    that: Maybe<T1>,
    that2: Maybe<T2>,
  ): Maybe<TOut>;
  zipWith<T1, T2, T3, TOut>(
    f: (x: T1, y: T2, z: T3) => Nullable<TOut>,
    that: Maybe<T1>,
    that2: Maybe<T2>,
    that3: Maybe<T3>,
  ): Maybe<TOut>;
  zipWith<TOut>(
    this: Maybe<T>,
    f: (...xs: unknown[]) => Nullable<TOut>,
    ...thats: Maybe<unknown>[]
  ): Maybe<TOut> {
    const ms = [this, ...thats];
    return ms.some(Maybe.isNothing) ? Nothing : Maybe(f(ms.map(Maybe.unwrap)));
  }

  // endregion

  // region Type-constrained operations

  /**
   * Flatten the provided nested `Maybe`.
   *
   * This is monadic `join`.
   */
  flat<U>(this: Maybe<Maybe<U>>): Maybe<U> {
    return this.flatMap(x => x);
  }

  /**
   * Lifts this `Maybe` into a `TaskMaybe`, to allow deferred computations to be
   * performed on this `Maybe`.
   */
  liftTask(this: Maybe<T>): TaskMaybe<T> {
    return TaskMaybe(() => this);
  }

  /**
   * Returns a `Right` containing `Nothing` if `this` is `Nothing`; if the inner
   * `Either` is a `Left`, return that `Left`; otherwise, return a `Right`
   * containing a `Maybe` containing the innermost value.
   */
  transpose<L, R>(this: Maybe<Either<L, Nullable<R>>>): Either<L, Maybe<R>> {
    return this.match({
      Just: x =>
        x.match({
          Right: y => Right(Maybe(y)),
          Left: y => Left(y),
        }),
      Nothing: () => Right(Nothing),
    });
  }

  // endregion

  // region Derived abstract conversion operations

  /**
   * If `this` is `Just`, returns a `Left` containing the inner value, otherwise
   * returns a `Right` containing the provided value.
   *
   * @equiv `this.match({ Just: x => Left(x), Nothing: () => Right(r) })`
   */
  abstract toLeft<R>(r: R): Either<T, R>;

  /**
   * If `this` is `Just`, returns a `Right` containing the inner value,
   * otherwise returns a `Left` containing the provided value.
   *
   * @equiv `this.match({ Just: x => Right(x), Nothing: () => Left(l) })`
   */
  abstract toRight<L>(l: L): Either<L, T>;

  /**
   * If `this` is `Just`, returns a `Seq` of length 1 containing the inner
   * value, otherwise returns an empty `Seq`.
   *
   * @equiv `this.match({ Just: x => Seq(x), Nothing: () => Seq() })`
   */
  abstract toSeq(): Seq<T>;

  // endregion
}

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

  mapOrElse<U>(_g: () => U, f: (x: T) => U): U {
    return f(this.v);
  }

  narrow<U extends T>(f: (x: T) => x is U): Maybe<U> {
    return f(this.v) ? Maybe(this.v) : Nothing;
  }

  or(): Maybe<T> {
    return this;
  }

  orElse(): Maybe<T> {
    return this;
  }

  orNull(): T | null {
    return this.v;
  }

  orUndefined(): T | undefined {
    return this.v;
  }

  some(f: (x: T) => unknown): boolean {
    return !!f(this.v);
  }

  unwrap(): NonNullable<T> {
    return this.v;
  }

  xor(that: Maybe<T>): Maybe<T> {
    return that.isNothing() ? this : Nothing;
  }

  toLeft<R>(_r: R): Either<T, R> {
    return Left(this.v);
  }

  toRight<L>(_l: L): Either<L, T> {
    return Right(this.v);
  }

  toSeq(): Seq<T> {
    return Seq(this.v);
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

  mapOrElse<U>(g: () => U): U {
    return g();
  }

  narrow<U extends T>(): Maybe<U> {
    return Nothing;
  }

  or(that: Maybe<T>): Maybe<T> {
    return that;
  }

  orElse(f: () => Maybe<T>): Maybe<T> {
    return f();
  }

  orNull(): T | null {
    return null;
  }

  orUndefined(): T | undefined {
    return undefined;
  }

  some(): boolean {
    return false;
  }

  unwrap(): NonNullable<T> {
    throw new TypeError("unwrap called on instance of Nothing");
  }

  xor(that: Maybe<T>): Maybe<T> {
    return that;
  }

  toLeft<R>(r: R): Either<T, R> {
    return Right(r);
  }

  toRight<L>(l: L): Either<L, T> {
    return Left(l);
  }

  toSeq(): Seq<T> {
    return Seq();
  }
}

type Maybe_constructor = {
  <T>(this: void, x: Nullable<T>): Maybe<T>;
};

type Maybe_static = {
  isJust<T>(this: void, m: Maybe<T>): m is Just<T>;
  isNothing<T>(this: void, m: Maybe<T>): m is Nothing<T>;
  unwrap<T>(this: void, m: Maybe<T>): NonNullable<T>;
};

type Maybe_typeof = Maybe_constructor & Maybe_static;

/**
 * Represents an optional value. The constructor returns `Just` containing the
 * provided value if it is not nullish, otherwise returns `Nothing`.
 */
export type Maybe<T> = Just<T> | Nothing<T>;
export const Maybe: Maybe_typeof = Object.assign<Maybe_constructor, Maybe_static>(
  x => (x !== null && x !== undefined ? Just(x) : Nothing),
  {
    isJust: m => m.isJust(),
    isNothing: m => m.isNothing(),
    unwrap: m => m.unwrap(),
  },
);

export type Just<T> = _Just<T>;
export type Nothing<T> = _Nothing<T>;

export const Just = <T>(x: NonNullable<T>): Maybe<T> => new _Just(x);
export const Nothing: Maybe<never> = new _Nothing();
