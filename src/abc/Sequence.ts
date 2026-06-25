import { CollectionLike } from "@/abc/CollectionLike";
import type { Maybe } from "@/adt";
import type { SafeInt } from "@/numeric";

export abstract class Sequence<T> extends CollectionLike<T> {
  abstract drop(n: SafeInt): Sequence<T>;
  abstract head(): Maybe<T>;
  abstract tail(): Sequence<T>;
  abstract take(n: SafeInt): Sequence<T>;
  abstract zip<U>(that: Iterable<U>): Sequence<[T, U]>;
}
