class _Dict<K, V> implements Iterable<[K, V]> {
  private readonly d: ReadonlyMap<K, V>;

  constructor(pairs: Iterable<[K, V]>) {
    this.d = new Map(pairs);
  }

  size(): number {
    return this.d.size;
  }

  [Symbol.iterator]() {
    return this.d[Symbol.iterator]();
  }
}

export type Dict<K, V> = _Dict<K, V>;
export const Dict = <K, V>(...pairs: [K, V][]): Dict<K, V> => new _Dict(pairs);
