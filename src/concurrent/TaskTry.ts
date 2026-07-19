import { Failure, Success, type Try } from "@/adt/Try";
import type { Awaitable } from "@/concurrent/Awaitable";
import { Runnable } from "@/concurrent/Runnable";
import { Task } from "@/concurrent/Task";

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
      return res.isSuccess() ? f(res.get()).run() : Failure(res.failed().get());
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
      return Failure(res.failed().get());
    });
  }

  narrowOrElse<U extends T, E = unknown>(
    f: (x: T) => x is U,
    errorFactory: (x: T) => Awaitable<E>,
  ): TaskTry<U> {
    return new _TaskTry(async () => {
      const res = await this.task();
      if (res.isFailure()) {
        return Failure<U>(res.failed().get());
      }
      const x = res.get();
      return f(x) ? Success(x) : Failure(await errorFactory(x));
    });
  }

  unlift(): Task<Try<T>> {
    return Task(async () => await this.task());
  }
}

type TaskTry_constructor = {
  <T>(f: () => Awaitable<T>): TaskTry<T>;
};

type TaskTry_static = {
  from<T>(this: void, f: () => Awaitable<Try<T>>): TaskTry<T>;
};

type TaskTry_typeof = TaskTry_constructor & TaskTry_static;

/**
 * Represents a deferred, fallible computation that may be async. Functorial
 * and monadic operations on this type "reach into" the inner `Try` directly.
 *
 * This is the monad transformer `TryT<Task, T>`.
 *
 * Usage notes: The `TaskTry` constructor takes a fallible computation directly.
 * If you have a `Try` and would like to lift it into the `Task` context, use
 * `Try.liftTask` or `TaskTry.from`.
 */
export type TaskTry<T> = _TaskTry<T>;
export const TaskTry: TaskTry_typeof = Object.assign<TaskTry_constructor, TaskTry_static>(
  f =>
    new _TaskTry(async () => {
      try {
        return Success(await f());
      } catch (e) {
        return Failure(e);
      }
    }),
  {
    from: f => new _TaskTry(async () => await f()),
  },
);
