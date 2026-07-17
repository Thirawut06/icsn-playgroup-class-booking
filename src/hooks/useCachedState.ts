import { useState, useEffect } from 'react';

const globalCache: Record<string, unknown> = {};

/**
 * A hook that caches state in memory to survive navigation without full page reload.
 * @param namespace - Unique namespace for the feature (e.g., 'apply', 'book')
 * @param key - The specific state key
 * @param defaultValue - Initial value if not cached
 */
export function useCachedState<T>(
  namespace: string,
  key: string,
  defaultValue: T
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const fullKey = `${namespace}::${key}`;

  const [state, setState] = useState<T>(() => {
    if (fullKey in globalCache) {
      return globalCache[fullKey] as T;
    }
    return defaultValue;
  });

  useEffect(() => {
    globalCache[fullKey] = state;
  }, [fullKey, state]);

  return [state, setState];
}
