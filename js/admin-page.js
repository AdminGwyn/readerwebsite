import { requireAuth, logout } from "./auth.js";
import {
  loadLibrary,
  saveLibrary,
  upsertStory,
  deleteStory,
  ensureCategory,
  getStoryById,
} from "./store.js";

requireAuth();

const $ = (s, r = document) => r.querySelector(s);

function uid() {
  return crypto.randomUUID?.() || `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function renderCategorySelect() {
  const lib = loadLibrary();
  const sel = $("#f-category");
  sel.innerHTML = "";
  lib.categories.forEach((c) => {
    const o = document.createElement("option");
    o.value = c;
    o.textContent = c;
    sel.appendChild(o);
  });
}

function renderTable() {
  const lib = loadLibrary();
  const tb = $("#story-table tbody");
  tb.innerHTML = "";
  lib.stories.forEach((s) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong>${escapeHtml(s.title)}</strong><div class="muted" style="font-size:0.82rem">${escapeHtml(s.author)}</div></td>
      <td>${escapeHtml(s.category)}</td>
      <td>${s.chapters?.length ?? 0}</td>
      <td style="white-space:nowrap">
        <button type="button" data-edit="${s.id}" class="btn btn-ghost" style="padding:0.35rem 0.5rem;font-size:0.82rem">Sửa</button>
        <button type="button" data-del="${s.id}" class="btn btn-ghost" style="padding:0.35rem 0.5rem;font-size:0.82rem;color:#b45309">Xóa</button>
      </td>
    `;
    tb.appendChild(tr);
  });
  tb.querySelectorAll("[data-edit]").forEach((b) =>
    b.addEventListener("click", () => loadForm(b.getAttribute("data-edit")))
  );
  tb.querySelectorAll("[data-del]").forEach((b) =>
    b.addEventListener("click", () => {
      if (!confirm("Xóa tài liệu này?")) return;
      deleteStory(b.getAttribute("data-del"));
      renderTable();
    })
  );
}

function escapeHtml(s) {
  const d = document.createElement("div");
  d.textContent = s;
  return d.innerHTML;
}

const chaptersRoot = $("#chapters-root");

function addChapterRow(ch = { id: uid(), title: "", html: "" }) {
  const wrap = document.createElement("div");
  wrap.className = "chapter-card";
  wrap.dataset.chapterId = ch.id;
  wrap.innerHTML = `
    <div class="chapter-toolbar">
      <button type="button" data-act="up">Lên</button>
      <button type="button" data-act="down">Xuống</button>
      <button type="button" data-act="del" style="color:#b45309">Xóa chương</button>
    </div>
    <div class="adm-field">
      <label>Tiêu đề chương</label>
      <input type="text" class="ch-title" required />
    </div>
    <div class="adm-field" style="margin-top:0.5rem">
      <label>Nội dung HTML</label>
      <textarea class="ch-html" rows="8" placeholder="Dùng thẻ <p>, <h2>…"></textarea>
    </div>
  `;
  wrap.querySelector(".ch-title").value = ch.title;
  wrap.querySelector(".ch-html").value = ch.html;
  chaptersRoot.appendChild(wrap);

  wrap.querySelector("[data-act=up]").addEventListener("click", () => {
    if (wrap.previousElementSibling) wrap.previousElementSibling.before(wrap);
  });
  wrap.querySelector("[data-act=down]").addEventListener("click", () => {
    if (wrap.nextElementSibling) wrap.nextElementSibling.after(wrap);
  });
  wrap.querySelector("[data-act=del]").addEventListener("click", () => {
    if (chaptersRoot.children.length <= 1) {
      alert("Cần ít nhất một chương.");
      return;
    }
    wrap.remove();
  });
}

function clearChapters() {
  chaptersRoot.innerHTML = "";
}

function readChaptersFromDom() {
  return [...chaptersRoot.querySelectorAll(".chapter-card")].map((card) => ({
    id: card.dataset.chapterId || uid(),
    title: card.querySelector(".ch-title").value.trim(),
    html: card.querySelector(".ch-html").value.trim(),
  }));
}

function loadForm(id) {
  const s = getStoryById(id);
  if (!s) return;
  $("#editor-title").textContent = `Biên tập: ${s.title}`;
  $("#f-id").value = s.id;
  $("#f-title").value = s.title;
  $("#f-subtitle").value = s.subtitle || "";
  $("#f-author").value = s.author;
  $("#f-publisher").value = s.publisher || "";
  $("#f-category").value = s.category;
  $("#f-synopsis").value = s.synopsis || "";
  $("#f-cover").value = s.cover || "";
  clearChapters();
  (s.chapters || []).forEach((c) => addChapterRow(c));
  if (!chaptersRoot.children.length) addChapterRow();
}

function newForm() {
  $("#editor-title").textContent = "Tài liệu mới";
  $("#f-id").value = "";
  $("#f-title").value = "";
  $("#f-subtitle").value = "";
  $("#f-author").value = "";
  $("#f-publisher").value = "";
  $("#f-synopsis").value = "";
  $("#f-cover").value = "";
  $("#f-newcat").value = "";
  clearChapters();
  addChapterRow({ id: uid(), title: "Lời giới thiệu", html: "<p>Nội dung chương…</p>" });
}

$("#story-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const chapters = readChaptersFromDom().filter((c) => c.title && c.html);
  if (!chapters.length) {
    alert("Thêm ít nhất một chương có tiêu đề và nội dung.");
    return;
  }
  const newCat = $("#f-newcat").value.trim();
  if (newCat) ensureCategory(newCat);

  const lib = loadLibrary();
  const cat = newCat || $("#f-category").value || lib.categories[0];

  const sid = $("#f-id").value.trim();
  const prev = sid ? getStoryById(sid) : null;

  const story = {
    id: sid || uid(),
    title: $("#f-title").value.trim(),
    subtitle: $("#f-subtitle").value.trim(),
    author: $("#f-author").value.trim(),
    publisher: $("#f-publisher").value.trim(),
    category: cat,
    synopsis: $("#f-synopsis").value.trim(),
    cover: $("#f-cover").value.trim() || "assets/cover-academic.svg",
    chapters,
    createdAt: prev?.createdAt || new Date().toISOString(),
  };

  upsertStory(story);
  renderCategorySelect();
  $("#f-category").value = story.category;
  $("#f-id").value = story.id;
  renderTable();
  alert("Đã lưu.");
});

$("#btn-new").addEventListener("click", () => {
  newForm();
  renderCategorySelect();
});

$("#btn-preview").addEventListener("click", () => {
  const id = $("#f-id").value;
  if (!id) {
    alert("Lưu trước khi xem trước.");
    return;
  }
  window.open(`reader.html?id=${encodeURIComponent(id)}`, "_blank");
});

$("#f-cover-file").addEventListener("change", async (e) => {
  const f = e.target.files?.[0];
  if (!f) return;
  const reader = new FileReader();
  reader.onload = () => {
    $("#f-cover").value = reader.result;
    alert("Đã nhận ảnh bìa (data URL). Nhấn Lưu để ghi vào thư viện.");
  };
  reader.readAsDataURL(f);
});

$("#btn-export").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(loadLibrary(), null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "reader-pro-library.json";
  a.click();
  URL.revokeObjectURL(a.href);
});

$("#import-file").addEventListener("change", async (e) => {
  const f = e.target.files?.[0];
  if (!f) return;
  try {
    const text = await f.text();
    const data = JSON.parse(text);
    if (!data.stories || !Array.isArray(data.stories)) throw new Error("invalid");
    saveLibrary(data);
    renderCategorySelect();
    renderTable();
    alert("Đã nhập thư viện.");
  } catch {
    alert("File JSON không hợp lệ.");
  }
  e.target.value = "";
});

$("#btn-logout").addEventListener("click", () => {
  logout();
  location.href = "index.html";
});

renderCategorySelect();
renderTable();
newForm();
