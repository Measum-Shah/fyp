const isDeepEqual = (a: unknown, b: unknown): boolean => {
  if (a === b) return true;
  if (Number.isNaN(a as number) && Number.isNaN(b as number)) return true;

  if (a === null || a === undefined || b === null || b === undefined) return false;

  const typeA = typeof a;
  const typeB = typeof b;
  if (typeA !== typeB) return false;

  if (typeA !== "object") {
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