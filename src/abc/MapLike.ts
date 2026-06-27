import { CollectionLike } from "@/abc/CollectionLike";
import type { Enumerable } from "@/abc/Enumerable";
import type { Maybe } from "@/adt";
import type { Hashable } from "@/collections/Hashable";

export abstract class MapLike<K extends Hashable, V> extends CollectionLike<[K, V]> {
  abstract catMaybes(this: MapLike<K, Maybe<V>>): MapLike<K, NonNullable<V>>;
  abstract entries(): CollectionLike<[K, V]>;
  override every<K2 extends K, V2 extends V>(
    f: (x: [K, V]) => x is [K2, V2],
  ): this is MapLike<K2, V2>;
  override every(f: (x: [K, V]) => unknown): boolean {
    return this.entries().every(f);
  }

  override filter<K2 extends K, V2 extends V>(
    f: (x: [K, V]) => x is [K2, V2],
  ): Enumerable<[K2, V2]>;
  override filter(f: (x: [K, V]) => unknown): Enumerable<[K, V]> {
    return this.entries().filter(f);
  }
  override find(f: (x: [K, V]) => unknown): Maybe<[K, V]> {
    return this.entries().find(f);
  }
  abstract flatMap<U>(f: (x: [K, V]) => CollectionLike<U>): CollectionLike<U>;
  abstract flatMap<U>(f: (x: [K, V]) => CollectionLike<[K, U]>): MapLike<K, U>;
  abstract flatMap<K2 extends Hashable, V2>(
    f: (x: [K, V]) => CollectionLike<[K2, V2]>,
  ): MapLike<K2, V2>;
  override forEach(f: (x: [K, V]) => void): void {
    return this.entries().forEach(f);
  }
  abstract get(k: K): Maybe<V>;
  abstract liftMaybes(): MapLike<K, Maybe<V>>;
  abstract map<U>(f: (x: [K, V]) => U): CollectionLike<U>;
  abstract map<U>(f: (x: [K, V]) => [K, U]): MapLike<K, U>;
  abstract map<K2 extends Hashable, V2>(f: (x: [K, V]) => [K2, V2]): MapLike<K2, V2>;
  override reduce<U>(op: (prev: U, curr: [K, V]) => U, z: U): U {
    return this.entries().reduce(op, z);
  }
  override some(f: (x: [K, V]) => unknown): boolean {
    return this.entries().some(f);
  }
}
