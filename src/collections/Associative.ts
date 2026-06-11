import type { Maybe } from "@/adt";
import { LazySeq } from "@/collections/LazySeq";

export abstract class Associative<K, V> implements Iterable<[K, V]> {
  abstract entries(): LazySeq<[K, V]>;
  abstract find(f: (x: [K, V]) => unknown): Maybe<[K, V]>;
  abstract get(k: K): Maybe<V>;
  abstract liftMaybes(): Associative<K, Maybe<V>>;
  abstract size(): number;
  abstract [Symbol.iterator](): Iterator<[K, V]>;
}
