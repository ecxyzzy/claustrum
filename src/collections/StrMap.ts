import { CollectionLike } from "@/abc/CollectionLike";
import { MapLike } from "@/abc/MapLike";
import { Maybe } from "@/adt/Maybe";
import type { Hashable } from "@/collections/Hashable";
import { HashMap } from "@/collections/HashMap";
import { LazyList } from "@/collections/LazyList";

class _StrMap<V> extends MapLike<string, V> {
  private readonly d: ReadonlyMap<string, V>;

  constructor(pairs: Iterable<[string, V]>) {
    super();
    this.d = new Map(pairs);
  }

  catMaybes(this: StrMap<Maybe<V>>): StrMap<NonNullable<V>> {
    const pairs: [string, NonNullable<V>][] = [];
    for (const [k, mv] of this.d.entries()) {
      for (const v of mv) {
        pairs.push([k, v]);
      }
    }
    return new _StrMap(pairs);
  }

  entries(): CollectionLike<[string, V]> {
    return LazyList.fromIter(this[Symbol.iterator]());
  }

  find(f: (x: [string, V]) => unknown): Maybe<[string, V]> {
    return this.entries().find(f);
  }

  flatMap<U>(f: (x: [string, V]) => CollectionLike<U>): CollectionLike<U>;
  flatMap<U>(f: (x: [string, V]) => CollectionLike<[string, U]>): StrMap<U>;
  flatMap<K2 extends Hashable, V2>(
    f: (x: [string, V]) => CollectionLike<[K2, V2]>,
  ): HashMap<K2, V2>;
  flatMap(
    f: (x: [string, V]) => CollectionLike<unknown>,
  ): CollectionLike<unknown> | MapLike<Hashable, unknown> {
    const ys = this.entries().flatMap(f);
    if (ys.every((y): y is [unknown, unknown] => Array.isArray(y))) {
      if (ys.every((y): y is [string, unknown] => typeof y[0] === "string")) {
        return StrMap(...ys);
      }
      if (ys.every((y): y is [Hashable, unknown] => !!y)) {
        return HashMap(...ys);
      }
    }
    return ys;
  }

  get(k: string): Maybe<V> {
    return Maybe(this.d.get(k));
  }

  liftMaybes(): StrMap<Maybe<V>> {
    return new _StrMap(this.entries().map(([k, v]) => [k, Maybe(v)]));
  }

  map<U>(f: (x: [string, V]) => U): CollectionLike<U>;
  map<U>(f: (x: [string, V]) => [string, U]): StrMap<U>;
  map<K2 extends Hashable, V2>(f: (x: [string, V]) => [K2, V2]): HashMap<K2, V2>;
  map(f: (x: [string, V]) => unknown): CollectionLike<unknown> | MapLike<Hashable, unknown> {
    const ys = this.entries().map(f);
    if (ys.every((y): y is [unknown, unknown] => Array.isArray(y))) {
      if (ys.every((y): y is [string, unknown] => typeof y[0] === "string")) {
        return StrMap(...ys);
      }
      if (ys.every((y): y is [Hashable, unknown] => !!y)) {
        return HashMap(...ys);
      }
    }
    return ys;
  }

  size(): number {
    return this.d.size;
  }

  [Symbol.iterator]() {
    return this.d[Symbol.iterator]();
  }
}

type StrMap_constructor = {
  <V>(...pairs: [string, V][]): StrMap<V>;
};

type StrMap_static = {
  entries<V>(d: StrMap<V>): CollectionLike<[string, V]>;
  from<V>(record: Record<string, V>): StrMap<V>;
  size<V>(d: StrMap<V>): number;
};

type StrMap_typeof = StrMap_constructor & StrMap_static;

export type StrMap<V> = _StrMap<V>;
export const StrMap: StrMap_typeof = Object.assign<StrMap_constructor, StrMap_static>(
  (...pairs) => new _StrMap(pairs),
  {
    entries: d => d.entries(),
    from: record => new _StrMap(Object.entries(record)),
    size: d => d.size(),
  },
);
