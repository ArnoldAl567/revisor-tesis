export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  programId: string | null;
};

const TOKEN_KEY = 'thesis_token';
const USER_KEY = 'thesis_user';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function setAuth(token: string, user: AuthUser) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function reviewerIdForRole(user: AuthUser | null): string {
  if (user?.role === 'ADVISOR' || user?.role === 'COORDINATOR' || user?.role === 'ADMIN') {
    return user.id;
  }
  return 'adv-01';
}
