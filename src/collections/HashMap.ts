import { Maybe, Nothing } from "@/adt";
import { type Associative } from "@/collections/Associative";
import type { Hashable } from "@/collections/Hashable";
import type { HashableObject } from "@/collections/HashableObject";
import { LazySeq } from "@/collections/LazySeq";
import { Seq } from "@/collections/Seq";

type HashableLiteral = "string" | "numerical" | "object";

class _HashMap<K extends Hashable, V> implements Associative<K, V> {
  private readonly m: ReadonlyMap<number, [K, V][]>;
  private readonly s: number;

  private static _fnv1a(s: string): number {
    return (
      // FNV-1a operates bytewise so naive Unicode byte-slicing is the desired behaviour
      // oxlint-disable-next-line typescript/no-misused-spread
      Seq(...s).reduce(
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

  entries(): LazySeq<[K, V]> {
    return LazySeq.from([...this]);
  }

  find(f: (x: [K, V]) => unknown): Maybe<[K, V]> {
    return this.entries().find(f);
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

  size(): number {
    return this.s;
  }

  [Symbol.iterator](): Iterator<[K, V]> {
    const vss = this.m.values();
    return (function* () {
      for (const vs of vss) {
        for (const v of vs) {
          yield v;
        }
      }
    })();
  }
}

type HashMap_constructor = {
  <K extends Hashable, V>(...pairs: [K, V][]): HashMap<K, V>;
};

type HashMap_static = {
  entries<K extends Hashable, V>(h: HashMap<K, V>): LazySeq<[K, V]>;
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
