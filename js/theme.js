const KEY = "reader_ui_theme";

export function initTheme() {
  const saved = localStorage.getItem(KEY);
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const theme = saved === "light" || saved === "dark" ? saved : prefersDark ? "dark" : "light";
  document.documentElement.setAttribute("data-theme", theme);
  return theme;
}

export function toggleTheme() {
  const t = document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
  const next = t === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", next);
  localStorage.setItem(KEY, next);
  return next;
}

export function themeIcon(isDark) {
  return isDark ? "☀️" : "🌙";
}
