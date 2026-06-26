import { CollectionLike } from "@/abc/CollectionLike";
import { Maybe } from "@/adt";
import type { SafeInt } from "@/numeric";

export abstract class Sequence<T> extends CollectionLike<T> {
  abstract catMaybes(this: Sequence<Maybe<T>>): Sequence<NonNullable<T>>;
  abstract drop(n: SafeInt): Sequence<T>;
  abstract head(): Maybe<T>;
  abstract join(separator?: string): string;
  liftMaybes(): Sequence<Maybe<T>> {
    return this.map(x => Maybe(x));
  }
  abstract map<U>(f: (x: T) => U): Sequence<U>;
  tail(): Sequence<T> {
    return this.drop(1);
  }
  abstract take(n: SafeInt): Sequence<T>;
  abstract zip<T1>(that: Iterable<T1>): Sequence<[T, T1]>;
  abstract zip<T1, T2>(that: Iterable<T1>, that2: Iterable<T2>): Sequence<[T, T1, T2]>;
  abstract zip<T1, T2, T3>(
    that: Iterable<T1>,
    that2: Iterable<T2>,
    that3: Iterable<T3>,
  ): Sequence<[T, T1, T2, T3]>;
}
