export function getAuthToken(): string | null {
  return localStorage.getItem("admin_token") || sessionStorage.getItem("demo_token") || null;
}

export function authHeaders(): Record<string, string> {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function isDemoMode(): boolean {
  return !localStorage.getItem("admin_token") && !!sessionStorage.getItem("demo_token");
}
