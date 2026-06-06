import type { Either } from "@/adt/Either";
import type { Maybe } from "@/adt/Maybe";
import type { Try } from "@/adt/Try";
import type { Awaitable } from "@/concurrent/Awaitable";
import { Runnable } from "@/concurrent/Runnable";
import { TaskEither } from "@/concurrent/TaskEither";
import { TaskMaybe } from "@/concurrent/TaskMaybe";
import { TaskTry } from "@/concurrent/TaskTry";

class _Task<T> extends Runnable<T> {
  constructor(task: () => Awaitable<T>) {
    super(task);
  }

  flatMap<U>(f: (x: T) => Task<U>): Task<U> {
    return Task(async () => f(await this.task()).run());
  }

  map<U>(f: (x: T) => Awaitable<U>): Task<U> {
    return Task(async () => f(await this.task()));
  }

  liftEither<L, R>(this: Task<Either<L, R>>): TaskEither<L, R> {
    return TaskEither(async () => await this.task());
  }

  liftMaybe<U>(this: Task<Maybe<U>>): TaskMaybe<U> {
    return TaskMaybe(async () => await this.task());
  }

  liftTry<U>(this: Task<Try<U>>): TaskTry<U> {
    return TaskTry.from(async () => await this.task());
  }
}

/**
 * Represents a deferred computation that may be async.
 */
export type Task<T> = _Task<T>;
export const Task = <T>(f: () => Awaitable<T>): Task<T> => new _Task(f);
