export const ADMIN_USER = "admin123";
export const ADMIN_PASS = "admin123";
const SESSION_KEY = "rp_auth";

export function login(username, password) {
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    sessionStorage.setItem(SESSION_KEY, "1");
    return true;
  }
  return false;
}

export function logout() {
  sessionStorage.removeItem(SESSION_KEY);
}

export function isAuthed() {
  return sessionStorage.getItem(SESSION_KEY) === "1";
}

/** Gọi ở đầu trang admin */
export function requireAuth() {
  if (!isAuthed()) {
    window.location.href = "index.html";
  }
}
