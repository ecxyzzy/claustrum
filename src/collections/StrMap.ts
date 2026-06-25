import type { Sequence } from "@/abc/Sequence";
import { Maybe } from "@/adt/Maybe";
import { LazyList } from "@/collections/LazyList";

class _StrMap<V> /* extends Associative<string, V> */ {
  private readonly d: ReadonlyMap<string, V>;

  constructor(pairs: Iterable<[string, V]>) {
    // super();
    this.d = new Map(pairs);
  }

  entries(): Sequence<[string, V]> {
    return LazyList.from([...this]);
  }

  find(f: (x: [string, V]) => unknown): Maybe<[string, V]> {
    return this.entries().find(f);
  }

  get(k: string): Maybe<V> {
    return Maybe(this.d.get(k));
  }

  liftMaybes(): StrMap<Maybe<V>> {
    return new _StrMap(this.entries().map(([k, v]) => [k, Maybe(v)]));
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
  entries<V>(d: StrMap<V>): Sequence<[string, V]>;
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
