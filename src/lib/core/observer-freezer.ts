const FROZEN_METHODS = ['observe', 'disconnect', 'takeRecords'] as const;

type FrozenMethod = (typeof FROZEN_METHODS)[number];

/**
 * Marks the listed `MutationObserver.prototype` methods as non-writable
 * and non-configurable. Existing observer instances continue to work
 * normally because they invoke methods through the prototype chain;
 * only re-assignment of the prototype methods is rejected.
 *
 * Idempotent — safe to call multiple times. Skipped silently outside the
 * browser (e.g. SSR / Node tests).
 */
export function freezeMutationObserverPrototype(): void {
  if (typeof MutationObserver === 'undefined') return;

  for (const methodName of FROZEN_METHODS) {
    lockPrototypeMethod(methodName);
  }
}

function lockPrototypeMethod(methodName: FrozenMethod): void {
  const proto = MutationObserver.prototype;
  const descriptor = Object.getOwnPropertyDescriptor(proto, methodName);
  if (!descriptor) return;
  if (descriptor.writable === false && descriptor.configurable === false) {
    return; // already locked
  }
  try {
    Object.defineProperty(proto, methodName, {
      value: descriptor.value,
      writable: false,
      configurable: false,
      enumerable: descriptor.enumerable ?? false,
    });
  } catch {
    // Some runtimes pre-lock these methods; nothing to do.
  }
}
