import { CollectionLike } from "@/abc/CollectionLike";
import type { Enumerable } from "@/abc/Enumerable";
import type { Sequence } from "@/abc/Sequence";
import type { Maybe } from "@/adt";

export abstract class Associative<K, V> extends CollectionLike<[K, V]> {
  abstract catMaybes(this: Associative<K, Maybe<V>>): Associative<K, NonNullable<V>>;
  abstract entries(): Sequence<[K, V]>;
  override filter<K2 extends K, V2 extends V>(
    f: (x: [K, V]) => x is [K2, V2],
  ): Enumerable<[K2, V2]>;
  override filter(f: (x: [K, V]) => unknown): Enumerable<[K, V]> {
    return this.entries().filter(f);
  }
  override find(f: (x: [K, V]) => unknown): Maybe<[K, V]> {
    return this.entries().find(f);
  }
  override forEach(f: (x: [K, V]) => void): void {
    return this.entries().forEach(f);
  }
  abstract get(k: K): Maybe<V>;
  abstract liftMaybes(): Associative<K, Maybe<V>>;
}
