import { Maybe } from "@/adt/Maybe";
import { type Associative } from "@/collections/Associative";
import { LazySeq } from "@/collections/LazySeq";

class _Dict<V> implements Associative<string, V> {
  private readonly d: ReadonlyMap<string, V>;

  constructor(pairs: Iterable<[string, V]>) {
    this.d = new Map(pairs);
  }

  entries(): LazySeq<[string, V]> {
    return LazySeq.from([...this]);
  }

  find(f: (x: [string, V]) => unknown): Maybe<[string, V]> {
    return this.entries().find(f);
  }

  get(k: string): Maybe<V> {
    return Maybe(this.d.get(k));
  }

  liftMaybes(): Dict<Maybe<V>> {
    return new _Dict(this.entries().map(([k, v]) => [k, Maybe(v)]));
  }

  size(): number {
    return this.d.size;
  }

  [Symbol.iterator]() {
    return this.d[Symbol.iterator]();
  }
}

type Dict_constructor = {
  <V>(...pairs: [string, V][]): Dict<V>;
};

type Dict_static = {
  entries<V>(d: Dict<V>): LazySeq<[string, V]>;
  from<V>(record: Record<string, V>): Dict<V>;
  size<V>(d: Dict<V>): number;
};

type Dict_typeof = Dict_constructor & Dict_static;

export type Dict<V> = _Dict<V>;
export const Dict: Dict_typeof = Object.assign<Dict_constructor, Dict_static>(
  (...pairs) => new _Dict(pairs),
  {
    entries: d => d.entries(),
    from: record => new _Dict(Object.entries(record)),
    size: d => d.size(),
  },
);
