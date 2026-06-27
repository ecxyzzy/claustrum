export abstract class Filterable<T> {
  abstract filter<U extends T>(f: (x: T) => x is U): Filterable<U>;
  abstract filter(f: (x: T) => unknown): Filterable<T>;
}
