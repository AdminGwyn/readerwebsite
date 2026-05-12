import { initTheme, toggleTheme, themeIcon } from "./theme.js";
import { login } from "./auth.js";

initTheme();
updateToggleLabel();

const btn = document.getElementById("theme-toggle");
if (btn) {
  btn.addEventListener("click", () => {
    toggleTheme();
    updateToggleLabel();
  });
}

function updateToggleLabel() {
  const dark = document.documentElement.getAttribute("data-theme") === "dark";
  const btn = document.getElementById("theme-toggle");
  if (btn) {
    btn.textContent = themeIcon(dark);
    btn.title = dark ? "Chế độ sáng" : "Chế độ tối";
  }
}

document.getElementById("year").textContent = String(new Date().getFullYear());

const dlg = document.getElementById("dlg-login");
document.getElementById("admin-fab")?.addEventListener("click", () => dlg?.showModal());
document.getElementById("adm-cancel")?.addEventListener("click", () => dlg?.close());
document.getElementById("adm-go")?.addEventListener("click", () => {
  const u = document.getElementById("adm-user").value.trim();
  const p = document.getElementById("adm-pass").value;
  if (login(u, p)) location.href = "admin.html";
  else alert("Sai tài khoản hoặc mật khẩu.");
});
