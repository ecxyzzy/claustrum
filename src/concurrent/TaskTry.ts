import { Failure, Success, type Try } from "@/adt/Try";
import { Runnable } from "@/concurrent/Runnable";
import { Task } from "@/concurrent/Task";
import type { Awaitable } from "@/types/Awaitable";

/**
 * Represents a deferred, fallible computation that may be async. Functorial
 * and monadic operations on this type "reach into" the inner `Try` directly.
 *
 * This is the monad transformer `TryT<Task, T>`.
 */
export type TaskTry<T> = _TaskTry<T>;
export const TaskTry = <T>(f: () => Awaitable<T>): TaskTry<T> =>
  new _TaskTry(async () => {
    try {
      return Success(await f());
    } catch (e) {
      return Failure(e);
    }
  });

class _TaskTry<T> extends Runnable<Try<T>> {
  constructor(task: () => Awaitable<Try<T>>) {
    super(task);
  }

  filterOrElse<E = unknown>(
    f: (x: T) => Awaitable<unknown>,
    errorFactory: (x: T) => Awaitable<E>,
  ): TaskTry<T> {
    return new _TaskTry(async () => {
      const res = await this.task();
      if (res.isFailure()) {
        return res;
      }
      const x = res.get();
      return (await f(x)) ? res : Failure(await errorFactory(x));
    });
  }

  flatMap<U>(f: (x: T) => TaskTry<U>): TaskTry<U> {
    return new _TaskTry(async () => {
      const res = await this.task();
      return res.isSuccess() ? f(res.get()).run() : (res as unknown as Failure<U>);
    });
  }

  map<U>(f: (x: T) => Awaitable<U>): TaskTry<U> {
    return new _TaskTry(async () => {
      const res = await this.task();
      if (res.isSuccess()) {
        try {
          return Success(await f(res.get()));
        } catch (e) {
          return Failure(e);
        }
      }
      return res as unknown as Failure<U>;
    });
  }

  unlift(): Task<Try<T>> {
    return Task(async () => await this.task());
  }
}
