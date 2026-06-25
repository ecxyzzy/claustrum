export abstract class Filterable<T> {
  abstract filter(f: (x: T) => unknown): Filterable<T>;
  abstract narrow<U extends T>(f: (x: T) => x is U): Filterable<U>;
}
