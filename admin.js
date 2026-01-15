// =============================
// Party Table Booking - admin.js
// ✅ วางทับได้ทั้งไฟล์
// ✅ FIX: Failed to fetch เมื่อรันบน GitHub Pages
// ✅ ใช้ POST แบบ x-www-form-urlencoded (ไม่ CORS preflight)
// ✅ เพิ่ม Toast แจ้งเตือนสวยๆ + error ชัดเจน
// =============================

const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbwYzPY2VcEjofjF_Kh4tNu0yjRjyGjPB8ykxBWVupLx8pdNB6_CPuGAHCQXo2bFXVkQ/exec";
const ADMIN_PASSWORD = "bsr1234";

let ALL = [];
let VIEW = [];

/* =============================
   ✅ Toast UI (แจ้งเตือนสวย)
============================= */
function ensureToast_() {
  if (document.getElementById("toastWrap")) return;

  const wrap = document.createElement("div");
  wrap.id = "toastWrap";
  wrap.style.cssText = `
    position: fixed; right: 16px; bottom: 16px; z-index: 999999;
    display: flex; flex-direction: column; gap: 10px;
    max-width: min(420px, calc(100vw - 24px));
  `;
  document.body.appendChild(wrap);
}
function toast(msg, type = "info", ms = 2800) {
  ensureToast_();

  const el = document.createElement("div");
  el.style.cssText = `
    padding: 12px 14px;
    border-radius: 14px;
    box-shadow: 0 16px 30px rgba(0,0,0,.12);
    font-weight: 700;
    background: rgba(255,255,255,.92);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(0,0,0,.06);
    display:flex; gap:10px; align-items:flex-start;
  `;

  const icon = document.createElement("div");
  icon.style.cssText = `font-size:18px; line-height:1.1; margin-top:1px;`;

  const text = document.createElement("div");
  text.style.cssText = `font-size:14px; font-weight:700; line-height:1.3; white-space:pre-line;`;

  const map = {
    info: { i: "ℹ️", b: "rgba(0,0,0,.06)" },
    ok: { i: "✅", b: "rgba(34,197,94,.20)" },
    warn: { i: "⚠️", b: "rgba(245,158,11,.25)" },
    err: { i: "❌", b: "rgba(239,68,68,.20)" }
  };
  const m = map[type] || map.info;
  icon.textContent = m.i;
  el.style.borderColor = m.b;

  text.textContent = msg;

  el.appendChild(icon);
  el.appendChild(text);

  const wrap = document.getElementById("toastWrap");
  wrap.appendChild(el);

  setTimeout(() => {
    el.style.transition = "all .25s ease";
    el.style.opacity = "0";
    el.style.transform = "translateY(8px)";
    setTimeout(() => el.remove(), 260);
  }, ms);
}

function esc(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
function digitsOnly(s) { return String(s || "").replace(/\D/g, ""); }
function normalizePhone(p) {
  let s = digitsOnly(String(p || "").trim());
  if (s.length === 9) s = "0" + s;
  if (s.length > 10) s = s.slice(0, 10);
  if (s.length >= 4) s = s.slice(0, 3) + "-" + s.slice(3);
  return s;
}
function fmtTime(s) {
  const raw = String(s || "");
  if (!raw) return "";
  return raw.replace("T", " ").replace(/\.\d+Z$/, "").replace(/Z$/, "");
}

/* =============================
   ✅ API Helper + Error ชัดเจน
============================= */
async function safeFetch_(url, options = {}) {
  try {
    const res = await fetch(url, options);
    const txt = await res.text();

    // พยายาม parse JSON
    let data = null;
    try { data = JSON.parse(txt); } catch (_) {}

    if (!res.ok) {
      const msg = (data && (data.message || data.error)) || txt || `HTTP ${res.status}`;
      throw new Error(msg);
    }
    if (!data) throw new Error("Response is not JSON (ตรวจสอบ WebApp URL)");
    return data;
  } catch (err) {
    // สรุปข้อความให้เข้าใจง่าย
    const hint =
      "\n\nวิธีแก้:\n- Apps Script Deploy ต้องเป็น Execute as: Me\n- Who has access: Anyone\n- ใช้ URL WebApp ล่าสุดใน admin.js";

    throw new Error((err.message || "Failed to fetch") + hint);
  }
}

async function apiGet(action) {
  return await safeFetch_(`${WEB_APP_URL}?action=${encodeURIComponent(action)}`, { method: "GET" });
}

// ✅ FIX: POST แบบ x-www-form-urlencoded เพื่อกัน CORS Preflight
async function apiPost(bodyObj) {
  const form = new URLSearchParams();
  Object.entries(bodyObj || {}).forEach(([k, v]) => form.append(k, String(v ?? "")));

  return await safeFetch_(WEB_APP_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
    body: form.toString()
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const loginBox = document.getElementById("loginBox");
  const adminPanel = document.getElementById("adminPanel");

  const adminPass = document.getElementById("adminPass");
  const btnLogin = document.getElementById("btnLogin");

  const btnBack = document.getElementById("btnBack");
  const btnReload = document.getElementById("btnReload");
  const btnPrint = document.getElementById("btnPrint");

  const adminStatus = document.getElementById("adminStatus");
  const adminStatus2 = document.getElementById("adminStatus2");

  const searchBox = document.getElementById("searchBox");
  const tableWrap = document.getElementById("tableWrap");

  const countAll = document.getElementById("countAll");
  const countShown = document.getElementById("countShown");

  const editModal = document.getElementById("editModal");
  const btnCloseModal = document.getElementById("btnCloseModal");
  const btnCancelModal = document.getElementById("btnCancelModal");
  const btnSaveEdit = document.getElementById("btnSaveEdit");
  const modalStatus = document.getElementById("modalStatus");

  const editId = document.getElementById("editId");
  const editZone = document.getElementById("editZone");
  const editTableNo = document.getElementById("editTableNo");
  const editBookerName = document.getElementById("editBookerName");
  const editStudentName = document.getElementById("editStudentName");
  const editClassLevel = document.getElementById("editClassLevel");
  const editTeacher = document.getElementById("editTeacher");
  const editPhone = document.getElementById("editPhone");

  function setStatus(msg, ok = true) {
    const t = (ok ? "✅ " : "❌ ") + msg;
    if (adminStatus) adminStatus.textContent = t;
    if (adminStatus2) adminStatus2.textContent = t;
  }

  function openModal() {
    if (!editModal) return;
    editModal.classList.remove("hidden");
    editModal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }
  function closeModal() {
    if (!editModal) return;
    editModal.classList.add("hidden");
    editModal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  btnCloseModal?.addEventListener("click", closeModal);
  btnCancelModal?.addEventListener("click", closeModal);
  editModal?.addEventListener("click", (e) => { if (e.target === editModal) closeModal(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });

  btnBack?.addEventListener("click", () => window.location.href = "./index.html");
  btnReload?.addEventListener("click", () => loadList());
  btnPrint?.addEventListener("click", () => window.print());
  searchBox?.addEventListener("input", renderCards);

  function matchRow(r, q) {
  if (!q) return true;

  const raw = q.toLowerCase().trim();
  const qUpper = q.toUpperCase().trim();

  // ✅ ถ้าค้นหาเป็นรูปแบบโต๊ะ เช่น A1, B12, J13 -> ให้ MATCH แบบตรงตัวเท่านั้น
  if (/^[A-J]\d{1,2}$/.test(qUpper)) {
    const seat = String((r.zone || "") + (r.tableNo || "")).toUpperCase().trim();
    return seat === qUpper;
  }

  // ✅ ถ้าพิมพ์เป็นเบอร์ -> ค้นหาเฉพาะตัวเลข
  const qDigits = digitsOnly(raw);
  if (qDigits && digitsOnly(r.phone).includes(qDigits)) return true;

  // ✅ ค้นหาทั่วไป
  const hay = [
    r.bookerName,
    r.studentName,
    r.classLevel,
    r.homeroomTeacher,
    (r.zone + r.tableNo),
    r.phone
  ].join(" ").toLowerCase();

  return hay.includes(raw);
}

  function renderCards() {
    const q = (searchBox?.value || "").trim();

    VIEW = ALL
      .filter(r => matchRow(r, q))
      .sort((a, b) => String((b.createdAt || b.timestamp || "")).localeCompare(String((a.createdAt || a.timestamp || ""))));

    countAll.textContent = ALL.length;
    countShown.textContent = VIEW.length;

    if (!VIEW.length) {
      tableWrap.innerHTML = `<div class="empty">ยังไม่มีรายการจอง</div>`;
      return;
    }

    tableWrap.innerHTML = VIEW.map(r => {
      const time = r.createdAt || r.timestamp || "";
      return `
        <div class="admin-card">
          <div class="admin-card__head">
            <div class="admin-card__ok">✅ พบการจอง</div>
            <div class="admin-card__seat">🪑 แถว ${esc(r.zone)} โต๊ะ ${esc(r.tableNo)}</div>
          </div>

          <div class="admin-card__grid">
            <div class="admin-item"><b>🙋 ผู้จอง:</b> ${esc(r.bookerName)}</div>
            <div class="admin-item"><b>👧 นักเรียน:</b> ${esc(r.studentName)}</div>
            <div class="admin-item"><b>🏫 ชั้น:</b> ${esc(r.classLevel)}</div>
            <div class="admin-item"><b>👩‍🏫 ครู:</b> ${esc(r.homeroomTeacher)}</div>
            <div class="admin-item"><b>📞 เบอร์:</b> ${esc(r.phone)}</div>
            <div class="admin-item"><b>🕒 เวลา:</b> ${esc(fmtTime(time))}</div>
          </div>

          <div class="admin-card__actions">
            <button class="btn-mini edit" data-act="edit" data-id="${esc(r.id)}">✏️ แก้ไข</button>
            <button class="btn-mini danger" data-act="del" data-id="${esc(r.id)}">🗑️ ลบ</button>
            <button class="btn-mini unlock" data-act="unlock" data-zone="${esc(r.zone)}" data-table="${esc(r.tableNo)}">🔓 ปลดโต๊ะ</button>
          </div>
        </div>
      `;
    }).join("");
  }

  async function loadList() {
    try {
      setStatus("กำลังโหลดข้อมูล...");
      const data = await apiGet("adminList");
      if (!data.ok) throw new Error(data.message || "โหลดข้อมูลไม่สำเร็จ");
      ALL = Array.isArray(data.bookings) ? data.bookings : [];

      setStatus(`โหลดแล้ว ${ALL.length} รายการ`);
      toast(`โหลดข้อมูลสำเร็จ (${ALL.length} รายการ)`, "ok");
      renderCards();
    } catch (err) {
      console.error(err);
      setStatus("เชื่อมต่อไม่ได้", false);
      toast("เชื่อมต่อ WebApp ไม่ได้\n" + err.message, "err", 6500);
    }
  }

  tableWrap?.addEventListener("click", async (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;

    const act = btn.dataset.act;

    try {
      if (act === "del") {
        const id = btn.dataset.id;
        if (!confirm("ยืนยันลบรายการนี้?")) return;

        toast("กำลังลบ...", "info");
        const res = await apiPost({ action: "adminDelete", id });
        if (!res.ok) throw new Error(res.message || "ลบไม่สำเร็จ");

        toast("ลบสำเร็จ", "ok");
        await loadList();
      }

      if (act === "unlock") {
        const zone = btn.dataset.zone;
        const tableNo = btn.dataset.table;
        if (!confirm(`ยืนยันปลดโต๊ะ แถว ${zone} โต๊ะ ${tableNo}?`)) return;

        toast("กำลังปลดโต๊ะ...", "info");
        const res = await apiPost({ action: "adminUnlock", zone, tableNo });
        if (!res.ok) throw new Error(res.message || "ปลดโต๊ะไม่สำเร็จ");

        toast("ปลดโต๊ะสำเร็จ", "ok");
        await loadList();
      }

      if (act === "edit") {
        const id = btn.dataset.id;
        const row = ALL.find(x => String(x.id) === String(id));
        if (!row) return toast("ไม่พบข้อมูลรายการนี้", "warn");

        modalStatus.textContent = "";
        editId.value = row.id ?? "";
        editZone.value = row.zone ?? "";
        editTableNo.value = row.tableNo ?? "";
        editBookerName.value = row.bookerName ?? "";
        editStudentName.value = row.studentName ?? "";
        editClassLevel.value = row.classLevel ?? "";
        editTeacher.value = row.homeroomTeacher ?? "";
        editPhone.value = row.phone ?? "";

        openModal();
      }
    } catch (err) {
      console.error(err);
      toast("ทำรายการไม่สำเร็จ\n" + (err.message || ""), "err", 6500);
    }
  });

  btnSaveEdit?.addEventListener("click", async () => {
    try {
      modalStatus.textContent = "⏳ กำลังบันทึก...";
      toast("กำลังบันทึก...", "info");

      const payload = {
        action: "adminUpdate",
        id: editId.value,
        zone: editZone.value.trim(),
        tableNo: editTableNo.value.trim(),
        bookerName: editBookerName.value.trim(),
        studentName: editStudentName.value.trim(),
        classLevel: editClassLevel.value.trim(),
        homeroomTeacher: editTeacher.value.trim(),
        phone: normalizePhone(editPhone.value.trim()),
      };

      const res = await apiPost(payload);
      if (!res.ok) throw new Error(res.message || "บันทึกไม่สำเร็จ");

      modalStatus.textContent = "✅ บันทึกสำเร็จ";
      toast("บันทึกสำเร็จ", "ok");

      closeModal();
      await loadList();
    } catch (err) {
      console.error(err);
      modalStatus.textContent = "❌ " + (err.message || "บันทึกไม่สำเร็จ");
      toast("บันทึกไม่สำเร็จ\n" + (err.message || ""), "err", 6500);
    }
  });

  btnLogin?.addEventListener("click", async () => {
    const p = adminPass.value.trim();
    if (p !== ADMIN_PASSWORD) {
      setStatus("รหัสผ่านไม่ถูกต้อง", false);
      toast("รหัสผ่านไม่ถูกต้อง", "warn");
      return;
    }

    toast("เข้าสู่ระบบสำเร็จ", "ok");
    loginBox.classList.add("hidden");
    adminPanel.classList.remove("hidden");

    btnReload.disabled = false;
    btnPrint.disabled = false;

    await loadList();
  });

  adminPass?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") btnLogin.click();
  });

  setStatus("กรอกรหัสผ่านเพื่อเข้าสู่ระบบ");
});
