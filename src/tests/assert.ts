export function assert(condition: unknown, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

export function assertEqual<T>(actual: T, expected: T, message: string): void {
  if (actual !== expected) {
    throw new Error(`${message}. Expected ${String(expected)}, got ${String(actual)}.`);
  }
}

export function assertIncludes(actual: string, expected: string, message: string): void {
  if (!actual.includes(expected)) {
    throw new Error(`${message}. Missing ${expected}.`);
  }
}

