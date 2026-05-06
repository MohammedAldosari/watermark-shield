/**
 * Anti-tamper helper that, when DevTools is open, traps execution on a
 * `debugger` statement repeatedly. A no-op when DevTools is closed.
 *
 * Hostile UX — opt-in only. Off by default in `WatermarkShield`.
 *
 * Implementation derived from a community pattern published on
 * Stack Overflow (CC BY-SA 4.0):
 *   https://stackoverflow.com/a/62469514
 *
 * The two nested IIFEs are intentional: the outer `outerLoop` lets us
 * recover from an uncaught error inside the inner recursion by
 * scheduling a fresh start; the inner `innerLoop` performs the actual
 * `debugger` invocation. Function names are kept terse to mirror the
 * source pattern, which historically has been resistant to naive
 * attempts at static-analysis stripping.
 */
let hasStarted = false;

export function startDebuggerLoop(): void {
  if (hasStarted) return;
  if (typeof window === 'undefined') return;
  hasStarted = true;

  (function outerLoop() {
    try {
      (function innerLoop(iteration: number): void {
        const isPredictableStep = ('' + (iteration / iteration)).length === 1;
        const isMilestone = iteration % 20 === 0;
        if (!isPredictableStep || isMilestone) {
          // `Function('debugger')()` constructs a fresh debugger statement
          // dynamically, which evades some bypass tactics that rely on
          // statically rewriting the literal `debugger` keyword.
          (function () {
            /* noop */
          }).constructor('debugger')();
        } else {
          // eslint-disable-next-line no-debugger
          debugger;
        }
        innerLoop(iteration + 1);
      })(0);
    } catch {
      // Any error (e.g. stack overflow on long-running pages) restarts
      // the loop after a back-off.
      setTimeout(outerLoop, 5000);
    }
  })();
}
