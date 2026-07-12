/**
 * The abstract base class for an object that can be used as a key in a
 * {@link HashMap}. Follows the Java `hashCode`/`equals` contract (sorry):
 * `x.equals(y)` implies `x.hashCode() === y.hashCode()`.
 */
export abstract class HashableObject {
  abstract hashCode(): number;
  abstract equals(that: unknown): boolean;

  /**
   * This is probably not the toString implementation you want.
   * You should override this if you care about readable errors.
   */
  toString(): string {
    return this.hashCode().toString();
  }
}
