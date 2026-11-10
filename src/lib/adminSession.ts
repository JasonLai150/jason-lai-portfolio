const KEY = "admin-password";

export function readStoredPassword(): string | null {
  try {
    return sessionStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function writeStoredPassword(value: string): void {
  try {
    sessionStorage.setItem(KEY, value);
  } catch {
    // storage unavailable; the in-memory session still works
  }
}

export function clearStoredPassword(): void {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
