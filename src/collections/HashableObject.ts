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
