/**
 * A value that, when `await`ed, yields a value of type `T`.
 *
 * For developers: Consider using this type param in functions of methods that
 * may accept `Promise`s or functions returning `Promise`s. This enables the
 * following syntactic sugar:
 *
 * ```ts
 * const fx = (f: () => Awaitable<T>) => { ... }
 * fx(() => 42) // this doesn't error
 *
 * const gx = (f: () => Promise<T>) => { ... }
 * // gx(() => 42) // this errors
 * ```
 */
export type Awaitable<T> = T | Promise<T>;
