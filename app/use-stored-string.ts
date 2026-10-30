import { useCallback, useSyncExternalStore } from "react";

// localStorage can throw (private browsing, blocked site data), so writes also
// land in memory and the value stays editable for the life of the page.
const memory = new Map<string, string | null>();
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => {
    listener();
  });
}

function onStorage(event: StorageEvent) {
  if (event.key !== null) {
    memory.delete(event.key);
  }
  notify();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) {
    window.addEventListener("storage", onStorage);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      window.removeEventListener("storage", onStorage);
    }
  };
}

function read(key: string): string | null {
  if (memory.has(key)) {
    return memory.get(key) ?? null;
  }
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

/**
 * A string persisted to localStorage under `key`. Reads return `fallback`
 * until a value is stored, and setting `null` removes the stored value.
 * The server render always uses `fallback`.
 */
export function useStoredString(
  key: string,
  fallback: string,
): [string, (value: string | null) => void] {
  const stored = useSyncExternalStore(
    subscribe,
    () => read(key),
    () => null,
  );

  const setStored = useCallback(
    (value: string | null) => {
      memory.set(key, value);
      try {
        if (value === null) {
          window.localStorage.removeItem(key);
        } else {
          window.localStorage.setItem(key, value);
        }
      } catch {
        // The in-memory value still applies.
      }
      notify();
    },
    [key],
  );

  return [stored ?? fallback, setStored];
}
