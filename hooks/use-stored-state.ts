import { useCallback, useMemo, useSyncExternalStore } from "react";

type StorageName = "localStorage" | "sessionStorage";

// Storage can be unavailable, such as when site data is blocked, so every
// write also lands here and holds for the life of the page.
const memory = new Map<string, string>();
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function read(storage: StorageName, key: string): string | null {
  const remembered = memory.get(`${storage}:${key}`);
  if (remembered !== undefined) {
    return remembered;
  }
  try {
    return window[storage].getItem(key);
  } catch {
    return null;
  }
}

function parse<T>(stored: string | null, initialValue: T): T {
  if (stored === null) {
    return initialValue;
  }
  try {
    return JSON.parse(stored) as T;
  } catch {
    return initialValue;
  }
}

/**
 * State saved as JSON to `localStorage` or `sessionStorage` under `key`, so it
 * survives a page refresh. It reads as `initialValue` until a value is saved,
 * and always during the server render.
 */
export function useStoredState<T>(
  storage: StorageName,
  key: string,
  initialValue: T,
): [T, (value: T) => void] {
  const stored = useSyncExternalStore(
    subscribe,
    () => read(storage, key),
    () => null,
  );
  const value = useMemo(
    () => parse(stored, initialValue),
    [stored, initialValue],
  );

  const setValue = useCallback(
    (next: T) => {
      const serialized = JSON.stringify(next);
      memory.set(`${storage}:${key}`, serialized);
      try {
        window[storage].setItem(key, serialized);
      } catch {
        // The value in memory still applies.
      }
      listeners.forEach((listener) => {
        listener();
      });
    },
    [storage, key],
  );

  return [value, setValue];
}
