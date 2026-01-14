/***************************************************
 * admin.js (FULL OVERRIDE FOR YOUR admin.html)
 * ✅ Fix Failed to fetch (use FormData)
 * ✅ Works with ".hidden" class
 * ✅ Render bookings as "CHECK STYLE" (เหมือนหน้าตรวจสอบ)
 * ✅ Search / Edit modal / Delete / Unlock
 * ✅ Back / Reload / Print / Cancel modal
 * ✅ Password: bsr1234
 ***************************************************/

// ✅ ใส่ URL WebApp ของคุณให้ถูกต้อง (ต้องลงท้าย /exec)
const WEB_APP_URL =
  "https://script.google.com/macros/s/AKfycbwYzPY2VcEjofjF_Kh4tNu0yjRjyGjPB8ykxBWVupLx8pdNB6_CPuGAHCQXo2bFXVkQ/exec";

// ✅ รหัสผ่านแอดมิน
const ADMIN_PASSWORD = "bsr1234";

// =====================
// DOM
// =====================
const loginBox = document.getElementById("loginBox");
const adminPanel = document.getElementById("adminPanel");

const adminStatus = document.getElementById("adminStatus");
const adminStatus2 = document.getElementById("adminStatus2");

const btnLogin = document.getElementById("btnLogin");
const btnReload = document.getElementById("btnReload");
const btnPrint = document.getElementById("btnPrint");
const btnBack = document.getElementById("btnBack");

const searchBox = document.getElementById("searchBox");
const tableWrap = document.getElementById("tableWrap");

const countAll = document.getElementById("countAll");
const countShown = document.getElementById("countShown");

// Modal
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

let BOOKINGS = [];
let FILTERED = [];

// =====================
// Helpers
// =====================
function setText(el, txt) {
  if (!el) return;
  el.textContent = txt ?? "";
}

function escapeHtml(s = "") {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function show(el) {
  if (!el) return;
  el.classList.remove("hidden");
}

function hide(el) {
  if (!el) return;
  el.classList.add("hidden");
}

function isLoggedIn() {
  return sessionStorage.getItem("adminLoggedIn") === "1";
}

function enableTools(enabled) {
  if (btnReload) btnReload.disabled = !enabled;
  if (btnPrint) btnPrint.disabled = !enabled;
}

function normalizePhoneDigits(s) {
  return String(s || "").replace(/\D/g, "");
}

function formatTime(iso) {
  if (!iso) return "-";
  const s = String(iso);
  return s.replace("T", " ").replace(/\.\d+Z$/, "").replace(/Z$/, "");
}

// =====================
// API
// =====================
async function apiPost(body) {
  const fd = new FormData();
  Object.keys(body || {}).forEach((k) => fd.append(k, body[k]));

  const res = await fetch(WEB_APP_URL, {
    method: "POST",
    body: fd,
  });

  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return { ok: false, message: "API ไม่ได้ส่ง JSON", raw: text };
  }
}

async function apiGet(params) {
  const qs = new URLSearchParams(params).toString();
  const url = `${WEB_APP_URL}?${qs}`;
  const res = await fetch(url);
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return { ok: false, message: "API ไม่ได้ส่ง JSON", raw: text };
  }
}

// =====================
// Render
// =====================
function updateCounts() {
  setText(countAll, BOOKINGS.length);
  setText(countShown, FILTERED.length);
}

/**
 * ✅ Render แบบเดียวกับหน้า "ตรวจสอบ" (รูปที่ 2)
 * - การ์ดสวย + grid 2 คอลัมน์ + badge โต๊ะ
 * - ปุ่ม edit / unlock / delete
 */
function renderCards(items) {
  if (!tableWrap) return;

  if (!items.length) {
    tableWrap.innerHTML = `
      <div class="empty" style="padding:14px; font-weight:900; color:#6b7280;">
        ยังไม่มีรายการจอง
      </div>`;
    return;
  }

  tableWrap.innerHTML = items
    .map((r) => {
      const seat = `${escapeHtml(r.zone || "")} โต๊ะ ${escapeHtml(r.tableNo || "")}`;
      const time = formatTime(r.timestamp);
      const phone = escapeHtml(r.phone || "");

      return `
      <div class="checkCard adminCheckCard">
        <div class="checkCard__head">
          <div class="checkCard__title">✅ พบการจอง</div>
          <div class="checkCard__badge">🪑 ${seat}</div>
        </div>

        <div class="checkGrid">
          <div class="checkItem">
            <span class="checkIcon">🙋</span>
            <div>
              <div class="checkLabel">ผู้จอง:</div>
              <div class="checkValue">${escapeHtml(r.bookerName || "-")}</div>
            </div>
          </div>

          <div class="checkItem">
            <span class="checkIcon">🎓</span>
            <div>
              <div class="checkLabel">นักเรียน:</div>
              <div class="checkValue">${escapeHtml(r.studentName || "-")}</div>
            </div>
          </div>

          <div class="checkItem">
            <span class="checkIcon">🏫</span>
            <div>
              <div class="checkLabel">ชั้น:</div>
              <div class="checkValue">${escapeHtml(r.classLevel || "-")}</div>
            </div>
          </div>

          <div class="checkItem">
            <span class="checkIcon">👩‍🏫</span>
            <div>
              <div class="checkLabel">ครู:</div>
              <div class="checkValue">${escapeHtml(r.homeroomTeacher || "-")}</div>
            </div>
          </div>

          <div class="checkItem">
            <span class="checkIcon">📞</span>
            <div>
              <div class="checkLabel">เบอร์:</div>
              <div class="checkValue">${phone || "-"}</div>
            </div>
          </div>

          <div class="checkItem">
            <span class="checkIcon">🕒</span>
            <div>
              <div class="checkLabel">เวลา:</div>
              <div class="checkValue">${escapeHtml(time)}</div>
            </div>
          </div>
        </div>

        <div class="checkActions">
          <button class="btn-mini primary" data-act="edit" data-id="${escapeHtml(r.id)}">✏️ แก้ไข</button>
          <button class="btn-mini ghost" data-act="unlock" data-zone="${escapeHtml(r.zone)}" data-table="${escapeHtml(r.tableNo)}">🔓 ปลดโต๊ะ</button>
          <button class="btn-mini danger" data-act="delete" data-id="${escapeHtml(r.id)}">🗑️ ลบ</button>
        </div>
      </div>
      `;
    })
    .join("");
}

// =====================
// Data
// =====================
async function loadBookings() {
  setText(adminStatus2, "⏳ กำลังโหลดข้อมูล...");

  const data = await apiGet({ action: "adminList" });

  if (!data?.ok) {
    setText(
      adminStatus2,
      "❌ โหลดข้อมูลไม่สำเร็จ: " + (data?.message || data?.error || "unknown")
    );
    BOOKINGS = [];
    FILTERED = [];
    updateCounts();
    renderCards([]);
    return;
  }

  BOOKINGS = data.bookings || [];
  FILTERED = [...BOOKINGS];

  updateCounts();
  renderCards(FILTERED);

  setText(adminStatus2, `✅ โหลดแล้ว ${BOOKINGS.length} รายการ`);
}

function applySearch() {
  const q = (searchBox?.value || "").trim().toLowerCase();
  if (!q) {
    FILTERED = [...BOOKINGS];
  } else {
    FILTERED = BOOKINGS.filter((r) => {
      const text =
        `${r.zone}${r.tableNo} ${r.bookerName} ${r.studentName} ${r.classLevel} ${r.homeroomTeacher} ${r.phone}`
          .toLowerCase();
      return text.includes(q);
    });
  }
  updateCounts();
  renderCards(FILTERED);
}

// =====================
// Modal
// =====================
function openModal() {
  show(editModal);
  setText(modalStatus, "");
}

function closeModal() {
  hide(editModal);
  setText(modalStatus, "");
}

function fillModal(row) {
  editId.value = row.id || "";
  editZone.value = row.zone || "";
  editTableNo.value = row.tableNo || "";
  editBookerName.value = row.bookerName || "";
  editStudentName.value = row.studentName || "";
  editClassLevel.value = row.classLevel || "";
  editTeacher.value = row.homeroomTeacher || "";
  editPhone.value = row.phone || "";
}

// =====================
// Actions
// =====================
async function actDelete(id) {
  if (!confirm("ต้องการลบรายการนี้ใช่ไหม?")) return;

  setText(adminStatus2, "⏳ กำลังลบ...");
  const data = await apiPost({ action: "adminDelete", id });

  if (!data?.ok) {
    setText(adminStatus2, "❌ ลบไม่สำเร็จ: " + (data?.message || "unknown"));
    return;
  }

  setText(adminStatus2, "✅ ลบแล้ว");
  await loadBookings();
}

async function actUnlock(zone, tableNo) {
  if (!confirm(`ต้องการปลดโต๊ะ ${zone}${tableNo} ใช่ไหม?`)) return;

  setText(adminStatus2, "⏳ กำลังปลดโต๊ะ...");
  const data = await apiPost({ action: "adminUnlock", zone, tableNo });

  if (!data?.ok) {
    setText(adminStatus2, "❌ ปลดโต๊ะไม่สำเร็จ: " + (data?.message || "unknown"));
    return;
  }

  setText(adminStatus2, "✅ ปลดโต๊ะแล้ว");
  await loadBookings();
}

function actEdit(id) {
  const row = BOOKINGS.find((x) => String(x.id) === String(id));
  if (!row) return;
  fillModal(row);
  openModal();
}

async function saveEdit() {
  const id = (editId.value || "").trim();
  const zone = (editZone.value || "").trim();
  const tableNo = (editTableNo.value || "").trim();

  const bookerName = (editBookerName.value || "").trim();
  const studentName = (editStudentName.value || "").trim();
  const classLevel = (editClassLevel.value || "").trim();
  const homeroomTeacher = (editTeacher.value || "").trim();

  // ✅ normalize เบอร์: พิมพ์ 096-xxx ได้ / สุดท้ายส่งเป็นเลขล้วน
  const phone = normalizePhoneDigits(editPhone.value || "");

  if (!id) return setText(modalStatus, "❌ ไม่พบ id");
  if (!zone || !tableNo) return setText(modalStatus, "❌ กรุณากรอกโซน และเลขโต๊ะ");

  setText(modalStatus, "⏳ กำลังบันทึก...");

  const data = await apiPost({
    action: "adminUpdate",
    id,
    zone,
    tableNo,
    bookerName,
    studentName,
    classLevel,
    homeroomTeacher,
    phone,
  });

  if (!data?.ok) {
    setText(modalStatus, "❌ บันทึกไม่สำเร็จ: " + (data?.message || "unknown"));
    return;
  }

  setText(modalStatus, "✅ บันทึกสำเร็จ");
  await loadBookings();
  closeModal();
}

// =====================
// Events
// =====================
btnBack?.addEventListener("click", () => {
  window.location.href = "index.html";
});

btnLogin?.addEventListener("click", async () => {
  const pass = (document.getElementById("adminPass")?.value || "").trim();

  if (pass !== ADMIN_PASSWORD) {
    setText(adminStatus, "❌ รหัสผ่านไม่ถูกต้อง");
    return;
  }

  sessionStorage.setItem("adminLoggedIn", "1");
  setText(adminStatus, "✅ เข้าสู่ระบบสำเร็จ");

  hide(loginBox);
  show(adminPanel);
  enableTools(true);

  await loadBookings();
});

btnReload?.addEventListener("click", async () => {
  if (!isLoggedIn()) return;
  await loadBookings();
});

btnPrint?.addEventListener("click", () => {
  if (!isLoggedIn()) return;
  window.print();
});

searchBox?.addEventListener("input", applySearch);

// Modal close/cancel
btnCloseModal?.addEventListener("click", closeModal);
btnCancelModal?.addEventListener("click", closeModal);

// click outside modal
editModal?.addEventListener("click", (e) => {
  if (e.target === editModal) closeModal();
});

btnSaveEdit?.addEventListener("click", saveEdit);

// card button actions
document.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-act]");
  if (!btn) return;

  const act = btn.dataset.act;
  if (act === "edit") return actEdit(btn.dataset.id);
  if (act === "delete") return actDelete(btn.dataset.id);
  if (act === "unlock") return actUnlock(btn.dataset.zone, btn.dataset.table);
});

// =====================
// Init
// =====================
window.addEventListener("DOMContentLoaded", async () => {
  // เริ่มต้นปิดปุ่มก่อน
  enableTools(false);

  // ปิด modal
  hide(editModal);

  if (isLoggedIn()) {
    hide(loginBox);
    show(adminPanel);
    enableTools(true);
    await loadBookings();
  } else {
    show(loginBox);
    hide(adminPanel);
  }
});
