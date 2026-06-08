import type { Maybe } from "@/adt";
import { LazySeq } from "@/collections/LazySeq";

class _Dict<K, V> implements Iterable<[K, V]> {
  private readonly d: ReadonlyMap<K, V>;

  constructor(pairs: Iterable<[K, V]>) {
    this.d = new Map(pairs);
  }

  entries(): LazySeq<[K, V]> {
    return LazySeq.from(this.d);
  }

  find(f: (x: [K, V]) => unknown): Maybe<[K, V]> {
    return this.entries().find(f);
  }

  size(): number {
    return this.d.size;
  }

  [Symbol.iterator]() {
    return this.d[Symbol.iterator]();
  }
}

type Dict_constructor = {
  <K, V>(...pairs: [K, V][]): Dict<K, V>;
};

type Dict_static = {
  entries<K, V>(d: Dict<K, V>): LazySeq<[K, V]>;
  from<V>(record: Record<string, V>): Dict<string, V>;
  size<K, V>(d: Dict<K, V>): number;
};

type Dict_typeof = Dict_constructor & Dict_static;

export type Dict<K, V> = _Dict<K, V>;
export const Dict: Dict_typeof = Object.assign<Dict_constructor, Dict_static>(
  (...pairs) => new _Dict(pairs),
  {
    entries: d => d.entries(),
    from: record => new _Dict(Object.entries(record)),
    size: d => d.size(),
  },
);
