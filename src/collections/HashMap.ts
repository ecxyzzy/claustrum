import { CollectionLike } from "@/abc/CollectionLike";
import { MapLike } from "@/abc/MapLike";
import { Maybe, Nothing } from "@/adt";
import { Arr } from "@/collections/Arr";
import type { Hashable } from "@/collections/Hashable";
import type { HashableObject } from "@/collections/HashableObject";
import { LazyList } from "@/collections/LazyList";
import { StrMap } from "@/collections/StrMap";

type HashableLiteral = "string" | "numerical" | "object";

class _HashMap<K extends Hashable, V> extends MapLike<K, V> {
  private readonly m: ReadonlyMap<number, [K, V][]>;
  private readonly s: number;

  private static _fnv1a(s: string): number {
    return (
      // FNV-1a operates bytewise so naive Unicode byte-slicing is the desired behaviour
      // oxlint-disable-next-line typescript/no-misused-spread
      Arr(...s).reduce(
        (prev, curr) => Math.imul(prev ^ curr.charCodeAt(0), 0x01000193),
        0x811c9dc5,
      ) >>> 0
    );
  }

  private static _throw<K extends Hashable>(hash: number, type: HashableLiteral, k: K): never {
    throw new Error(
      `HashMap.get: found bucket with hash ${hash} for ${type} key ${k.toString()}, but key was not present in bucket`,
    );
  }

  private static _upsertInnerMap<K, V>(m: Map<number, [K, V][]>, hash: number, pair: [K, V]): void {
    if (m.has(hash)) {
      m.get(hash)!.push(pair);
    } else {
      m.set(hash, [pair]);
    }
  }

  constructor(pairs: Iterable<[K, V]>) {
    super();
    const m = new Map<number, [K, V][]>();
    let s = 0;
    for (const pair of pairs) {
      switch (typeof pair[0]) {
        case "string":
          _HashMap._upsertInnerMap(m, _HashMap._fnv1a(pair[0]), pair);
          break;
        case "number":
          m.set(pair[0], [pair]);
          break;
        case "object":
          _HashMap._upsertInnerMap(m, pair[0].hashCode(), pair);
      }
      ++s;
    }
    this.m = m;
    this.s = s;
  }

  catMaybes(this: HashMap<K, Maybe<V>>): HashMap<K, NonNullable<V>> {
    const pairs: [K, NonNullable<V>][] = [];
    for (const kvs of this.m.values()) {
      for (const [k, v] of kvs) {
        for (const iv of v) {
          pairs.push([k, iv]);
        }
      }
    }
    return new _HashMap(pairs);
  }

  entries(): CollectionLike<[K, V]> {
    return LazyList.from([...this]);
  }

  flatMap<U>(f: (x: [K, V]) => CollectionLike<U>): CollectionLike<U>;
  flatMap<U>(f: (x: [K, V]) => CollectionLike<[string, U]>): StrMap<U>;
  flatMap<K2 extends Hashable, V2>(f: (x: [K, V]) => CollectionLike<[K2, V2]>): HashMap<K2, V2>;
  flatMap(
    f: (x: [K, V]) => CollectionLike<unknown>,
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

  get(k: K): Maybe<V> {
    switch (typeof k) {
      case "string": {
        const hash = _HashMap._fnv1a(k);
        const maybeBucket = this.m.get(hash);
        if (!maybeBucket) return Nothing;
        const maybePair = maybeBucket.find(([l]) => l === k);
        return maybePair ? Maybe(maybePair[1]) : _HashMap._throw(hash, "string", k);
      }
      case "number": {
        const maybeBucket = this.m.get(k);
        if (!maybeBucket) return Nothing;
        return maybeBucket[0] ? Maybe(maybeBucket[0][1]) : _HashMap._throw(k, "numerical", k);
      }
      case "object": {
        const hash = k.hashCode();
        const maybeBucket = this.m.get(hash) as [HashableObject, V][] | undefined;
        if (!maybeBucket) return Nothing;
        const maybePair = maybeBucket.find(([l]) => l.equals(k));
        return maybePair ? Maybe(maybePair[1]) : _HashMap._throw(hash, "object", k);
      }
    }
  }

  liftMaybes(): HashMap<K, Maybe<V>> {
    return new _HashMap(this.entries().map(([k, v]) => [k, Maybe(v)]));
  }

  map<U>(f: (x: [K, V]) => U): CollectionLike<U>;
  map<U>(f: (x: [K, V]) => [string, U]): StrMap<U>;
  map<K2 extends Hashable, V2>(f: (x: [K, V]) => [K2, V2]): HashMap<K2, V2>;
  map(f: (x: [K, V]) => unknown): CollectionLike<unknown> | MapLike<Hashable, unknown> {
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
    return this.s;
  }

  toStrMap(this: HashMap<string, V>): StrMap<V> {
    return StrMap(...this.entries());
  }

  [Symbol.iterator](): Iterator<[K, V]> {
    const kvss = this.m.values();
    return (function* () {
      for (const kvs of kvss) {
        for (const kv of kvs) {
          yield kv;
        }
      }
    })();
  }
}

type HashMap_constructor = {
  <K extends Hashable, V>(...pairs: [K, V][]): HashMap<K, V>;
};

type HashMap_static = {
  entries<K extends Hashable, V>(h: HashMap<K, V>): CollectionLike<[K, V]>;
  size<K extends Hashable, V>(h: HashMap<K, V>): number;
};

type HashMap_typeof = HashMap_constructor & HashMap_static;

export type HashMap<K extends Hashable, V> = _HashMap<K, V>;
export const HashMap: HashMap_typeof = Object.assign<HashMap_constructor, HashMap_static>(
  (...pairs) => new _HashMap(pairs),
  {
    entries: h => h.entries(),
    size: h => h.size(),
  },
);
