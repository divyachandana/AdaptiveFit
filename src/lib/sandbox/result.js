// Result<T,E> type — inspired by RalphMeter's error handling pattern.
// Provides type-safe success/error handling without exceptions for model loading
// and inference operations that can fail (CDN timeouts, GPU unavailable, etc).

export function ok(value) {
  return { ok: true, value };
}

export function err(error) {
  return { ok: false, error: error instanceof Error ? error : new Error(String(error)) };
}

export function isOk(r) {
  return r && r.ok === true;
}

export function isErr(r) {
  return r && r.ok === false;
}

export function unwrap(r, fallback) {
  if (isOk(r)) return r.value;
  return fallback;
}

export function unwrapOr(r, defaultValue) {
  if (isOk(r)) return r.value;
  return defaultValue;
}