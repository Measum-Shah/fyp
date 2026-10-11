// ─── diffActivityValues ─────────────────────────────────────────────────────
// Reduces an Activity Log record's `previous_values` / `new_values` objects
// down to only the fields whose values actually changed between the two
// snapshots.
//
// This is a display-layer transform, applied when Activity Log rows are
// read back out for the "Sessions & Activity → Activity Log" screen. It is
// deliberately NOT applied to the write path (`recordActivity` in
// activityLog.service.ts): the full before/after snapshots are still
// written to `erp_activity_logs.previous_values` / `new_values` exactly as
// today, preserving the complete audit trail in the database. Only what is
// handed back to the API caller is narrowed to the changed subset, which is
// the only thing the Activity Log UI ever renders.
//
// "Changed" is determined by deep value comparison, not key presence — a
// field that exists in both snapshots with the same value (by deep
// equality) is dropped from both sides; a field that only exists in one
// snapshot (added/removed) counts as changed.

/**
 * Deep, order-independent-for-objects / order-sensitive-for-arrays equality
 * check. Handles null, undefined, booleans, numbers, strings, arrays, and
 * plain objects (including nested combinations of the above), which is the
 * full range of JSON-serializable shapes `previous_values` / `new_values`
 * can hold.
 */
const isDeepEqual = (a: unknown, b: unknown): boolean => {
  // Covers: identical primitives, identical references, NaN vs NaN (via
  // Object.is), +0 vs -0 treated as equal (via ===).
  if (a === b) return true;
  if (Number.isNaN(a as number) && Number.isNaN(b as number)) return true;

  // From here, any remaining case where either side is null/undefined but
  // they aren't strictly equal means they differ (e.g. null vs undefined,
  // null vs 0, null vs "", null vs {}).
  if (a === null || a === undefined || b === null || b === undefined) return false;

  const typeA = typeof a;
  const typeB = typeof b;
  if (typeA !== typeB) return false;

  if (typeA !== "object") {
    // Primitives (string/number/boolean/bigint/symbol) that reached here
    // already failed the === check above, so they're not equal.
    return false;
  }

  const arrayA = Array.isArray(a);
  const arrayB = Array.isArray(b);
  if (arrayA !== arrayB) return false;

  if (arrayA && arrayB) {
    const arrA = a as unknown[];
    const arrB = b as unknown[];
    if (arrA.length !== arrB.length) return false;
    for (let i = 0; i < arrA.length; i++) {
      if (!isDeepEqual(arrA[i], arrB[i])) return false;
    }
    return true;
  }

  // Plain objects — compare by key set + recursive value equality,
  // independent of key ordering.
  const objA = a as Record<string, unknown>;
  const objB = b as Record<string, unknown>;
  const keysA = Object.keys(objA);
  const keysB = Object.keys(objB);
  if (keysA.length !== keysB.length) return false;
  for (const key of keysA) {
    if (!Object.prototype.hasOwnProperty.call(objB, key)) return false;
    if (!isDeepEqual(objA[key], objB[key])) return false;
  }
  return true;
};

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export interface DiffedActivityValues {
  previousValues: Record<string, unknown> | null;
  newValues: Record<string, unknown> | null;
}

/**
 * Narrows a pair of Activity Log snapshots down to only the fields that
 * changed between them.
 *
 * If either side isn't a plain object (e.g. a create with `previous_values`
 * = null, a delete with `new_values` = null, or a login/logout event with
 * no values at all), there's nothing meaningful to diff — both sides are
 * returned unchanged, matching existing display behavior for those record
 * types.
 *
 * When both sides are plain objects, every key present in either object is
 * compared by deep value equality. Unchanged keys are dropped from both
 * results. If nothing changed (e.g. an update action whose logged
 * before/after snapshots are identical), both sides come back as `null` so
 * no empty/blank detail sections render.
 */
export const diffActivityValues = (
  previousValues: unknown,
  newValues: unknown
): DiffedActivityValues => {
  if (!isPlainObject(previousValues) || !isPlainObject(newValues)) {
    return {
      previousValues: isPlainObject(previousValues) ? previousValues : (previousValues as null),
      newValues: isPlainObject(newValues) ? newValues : (newValues as null),
    };
  }

  const allKeys = new Set([...Object.keys(previousValues), ...Object.keys(newValues)]);

  const changedPrevious: Record<string, unknown> = {};
  const changedNew: Record<string, unknown> = {};

  for (const key of allKeys) {
    const prevHasKey = Object.prototype.hasOwnProperty.call(previousValues, key);
    const nextHasKey = Object.prototype.hasOwnProperty.call(newValues, key);
    const prevVal = previousValues[key];
    const nextVal = newValues[key];

    // A key missing from one side but present on the other is a change
    // (field added or removed), even if the present side's value is
    // itself null/empty.
    const changed = prevHasKey !== nextHasKey ? true : !isDeepEqual(prevVal, nextVal);

    if (changed) {
      if (prevHasKey) changedPrevious[key] = prevVal;
      if (nextHasKey) changedNew[key] = nextVal;
    }
  }

  const hasChanges = Object.keys(changedPrevious).length > 0 || Object.keys(changedNew).length > 0;

  return {
    previousValues: hasChanges ? changedPrevious : null,
    newValues: hasChanges ? changedNew : null,
  };
};