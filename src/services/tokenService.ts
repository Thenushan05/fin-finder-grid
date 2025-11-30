const TOKEN_KEY = "access_token";

export function setToken(token: string | null) {
  try {
    if (token === null) {
      localStorage.removeItem(TOKEN_KEY);
    } else {
      localStorage.setItem(TOKEN_KEY, token);
    }
  } catch (e) {
    // ignore (SSR or restricted env)
  }
}

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch (e) {
    return null;
  }
}

export function clearToken() {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch (e) {}
}

export async function verifyToken(apiClient: any) {
  // Call /api/v1/auth/me to verify token and fetch user profile
  try {
    const res = await apiClient.get("/api/v1/auth/me");
    return res.data;
  } catch (e) {
    return null;
  }
}

export default { setToken, getToken, clearToken, verifyToken };
