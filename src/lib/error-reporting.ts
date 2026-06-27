/** Structured client error reporting — wire to Sentry later when @sentry/browser is installed. */
export function reportError(error: unknown, context: Record<string, unknown> = {}) {
  console.error("[Aetros]", error, context);
}
