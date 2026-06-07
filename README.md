# claustrum

> _claustrum_ (klaw'strum) [L. barrier.] One of several anatomical structures [...] specifically a thin, vertically placed lamina of grey matter [...] (_A Practical Medical Dictionary_, Stedman, 1920)

> [...] although [the claustrum's] functional evidence is unknown, there is good evidence to suggest that widespread regions of the cerebral cortex project onto the claustrum [...] (_Gray's Anatomy_, Clemente _ed._, 1985)

---

## FAQs

### What is this?

`claustrum` is an _opinionated_ library for _typed, [fluent-style](https://en.wikipedia.org/wiki/Fluent_interface), immutable functional programming_ in TypeScript.

### What are the design goals/principles of the library?

- **Fluent style is the library's raison d'être**. Every type will be designed so that method chaining is the path of least resistance.
- **Category-theoretic correctness matters, but so does performance.** Every method on every sum type can be defined in terms of `match`, the universal catamorphism over a sum type; however, we use abstract methods and dynamic dispatch instead, and express equivalencies in JSDoc.
- **Names matter.** They should be _familiar to TS devs_ (`some` and `every`, not `exists` and `forAll`; `flatMap`, not `andThen` or `chain`); _internally consistent_ (`*or` takes a value, `*orElse` takes a thunk); and _unambiguous_ (`Just`/`Nothing`, not `Some`/`None`, because `some()` is already a method).
- **The library should embrace TypeScript's strengths.** `orNull` and `orUndefined` exist not just as escape hatches, but also so you can use optional chaining and nullish coalescing without being forced to use `map` and `or`/`orElse`.
- **`async` virality is one of TypeScript's key weaknesses, and this library works around it.** We contain all deferred computations in thunks, until the `run()` method is explicitly invoked, to avoid downstream `async` requirements once a value becomes a `Promise`.
- **It should feel like you're writing functional code, not FP grafted onto OOP.** This is why classes are not exported and why constructors for types are functions, not actual constructors. You should never need to write `new` and that should feel good.
- **As much or as little of the library as you want can be used.** To facilitate tree-shaking and flexibility, each type is barrel-exported (`import { Maybe } from "claustrum"`), module-exported (`import { Maybe } from "claustrum/adt"`), and file-exported (`import { Maybe } from "claustrum/adt/Maybe"`).

### Why not just use Effect/fp-ts v3+ or fp-ts v2 or neverthrow or...

Those are excellent libraries in their own right. They also have their own opinions on how to accomplish typed functional programming in TypeScript, and our opinions do not align perfectly.

The debate on whether it is wise or detrimental to roll one's own implementation of a thing is of course perennial. For me, personally, this has been an interesting exercise.

### I'm sold, how do I use this?

```shell

% pnpm i claustrum@latest # or npm i, yarn add, etc.

```

Note that `claustrum` follows [Semantic Versioning](https://semver.org/) and is currently pre-1.0.0, so the usual caveats apply. I try not to break the API too hard commit-to-commit, but SemVer means that I can and that you should not rely on my word.

It's also very unfinished (apart from `Maybe`), so there's also that.

### What's in a name?

As the pretentious heading suggests, a claustrum (_pl._ claustra) is a thin sheet of grey matter that, while poorly understood, is generally believed to play a synchronizing role in brain function, as well as in potentially underpinning consciousness itself. The library is therefore so named because it intends to act as the coordination layer by which one can implement the [Functional Core, Imperative Shell](https://www.destroyallsoftware.com/screencasts/catalog/functional-core-imperative-shell) pattern.

Also, the plural form is an anagram of "scala" and "rust" smashed together, which are the languages with the two most outsized influences on the design and API of this library. (I tried to fit Haskell in there, but couldn't find a catchy name including all three.)
