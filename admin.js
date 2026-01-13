// =============================
// ✅ Admin Buttons Fix Version
// วางทับไฟล์ admin.js ทั้งหมดได้เลย
// =============================

const WEB_APP_URL =
  "https://script.google.com/macros/s/AKfycbwYzPY2VcEjofjF_Kh4tNu0yjRjyGjPB8ykxBWVupLx8pdNB6_CPuGAHCQXo2bFXVkQ/exec";

const ADMIN_PASSWORD = "bsr1234";

let ALL = [];
let VIEW = [];

// -----------------------------
// Utils
// -----------------------------
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
  let s = digitsOnly(p);
  if (s.length === 9 && !s.startsWith("0")) s = "0" + s;
  if (s && !s.startsWith("0")) s = "0" + s;
  if (s.length > 10) s = s.slice(0, 10);
  if (s.length >= 4) s = s.slice(0, 3) + "-" + s.slice(3);
  return s;
}
function fmtTime(s) {
  const raw = String(s || "");
  if (!raw) return "";
  return raw.replace("T", " ").replace(/\.\d+Z$/, "").replace(/Z$/, "");
}

// ✅ ตรวจสอบ WEB_APP_URL ให้ชัวร์ก่อน
function ensureWebAppUrl() {
  if (!WEB_APP_URL || !WEB_APP_URL.startsWith("https://script.google.com/macros/s/")) {
    alert("❌ WEB_APP_URL ไม่ถูกต้อง (ยังไม่ได้ตั้งค่า / ลิงก์ไม่ถูก)");
    return false;
  }
  return true;
}

async function apiGet(action) {
  if (!ensureWebAppUrl()) throw new Error("WEB_APP_URL ไม่ถูกต้อง");
  const res = await fetch(`${WEB_APP_URL}?action=${encodeURIComponent(action)}`);
  return await res.json();
}

async function apiPost(body) {
  if (!ensureWebAppUrl()) throw new Error("WEB_APP_URL ไม่ถูกต้อง");
  const res = await fetch(WEB_APP_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return await res.json();
}

// -----------------------------
// DOM init (แก้ปุ่มไม่ทำงานหลัก ๆ อยู่ตรงนี้)
// -----------------------------
document.addEventListener("DOMContentLoaded", () => {
  // ===== DOM =====
  const loginBox = document.getElementById("loginBox");
  const adminPanel = document.getElementById("adminPanel");
  const adminPass = document.getElementById("adminPass");
  const btnLogin = document.getElementById("btnLogin");
  const adminStatus = document.getElementById("adminStatus");

  const btnReload = document.getElementById("btnReload");
  const btnPrint = document.getElementById("btnPrint");

  const searchBox = document.getElementById("searchBox");
  const tableWrap = document.getElementById("tableWrap");
  const adminStatus2 = document.getElementById("adminStatus2");

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
  const editTeacher = document.getElementById("editTeacher");
  const editPhone = document.getElementById("editPhone");

  function setStatus(msg, ok = true) {
    const t = (ok ? "✅ " : "❌ ") + msg;
    if (adminStatus) adminStatus.textContent = t;
    if (adminStatus2) adminStatus2.textContent = t;
  }

  // -----------------------------
  // Modal
  // -----------------------------
  function openModal() {
    editModal?.classList.remove("hidden");
    if (editModal) editModal.style.display = "flex";
  }
  function closeModal() {
    editModal?.classList.add("hidden");
    if (editModal) editModal.style.display = "none";
  }

  btnCloseModal?.addEventListener("click", closeModal);
  btnCancelModal?.addEventListener("click", closeModal);

  editModal?.addEventListener("click", (e) => {
    if (e.target === editModal) closeModal();
  });

  // -----------------------------
  // Filter
  // -----------------------------
  function matchRow(r, q) {
    if (!q) return true;

    const raw = q.toLowerCase().trim();
    const qDigits = digitsOnly(raw);

    if (qDigits && digitsOnly(r.phone).includes(qDigits)) return true;

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

  // -----------------------------
  // Render cards
  // -----------------------------
  function renderCards() {
    const q = (searchBox?.value || "").trim();

    VIEW = ALL
      .filter(r => matchRow(r, q))
      .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));

    if (countAll) countAll.textContent = ALL.length;
    if (countShown) countShown.textContent = VIEW.length;

    if (!tableWrap) return;

    if (!VIEW.length) {
      tableWrap.innerHTML = `<div class="empty">ยังไม่มีรายการจอง</div>`;
      return;
    }

    tableWrap.innerHTML = VIEW.map(r => `
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
          <div class="admin-item"><b>🕒 เวลา:</b> ${esc(fmtTime(r.createdAt))}</div>
        </div>

        <div class="admin-card__actions">
          <button class="btn-mini edit" data-act="edit" data-id="${esc(r.id)}">✏️ แก้ไข</button>
          <button class="btn-mini danger" data-act="del" data-id="${esc(r.id)}">🗑️ ลบ</button>
          <button class="btn-mini unlock" data-act="unlock" data-zone="${esc(r.zone)}" data-table="${esc(r.tableNo)}">🔓 ปลดโต๊ะ</button>
        </div>
      </div>
    `).join("");
  }

  // -----------------------------
  // Load list
  // -----------------------------
  async function loadList() {
    try {
      setStatus("กำลังโหลดข้อมูล...");
      const data = await apiGet("adminList");
      if (!data.ok) throw new Error(data.message || "โหลดข้อมูลไม่สำเร็จ");

      ALL = Array.isArray(data.bookings) ? data.bookings : [];
      setStatus(`โหลดแล้ว ${ALL.length} รายการ`);
      renderCards();
    } catch (err) {
      console.error(err);
      setStatus(err.message || "โหลดข้อมูลไม่สำเร็จ", false);
      alert("❌ โหลดข้อมูลไม่สำเร็จ\n" + (err.message || ""));
    }
  }

  // -----------------------------
  // ✅ Buttons (Fix)
  // -----------------------------
  btnReload?.addEventListener("click", () => loadList());

  btnPrint?.addEventListener("click", () => {
    // ✅ ปริ้นทันที
    window.print();
  });

  searchBox?.addEventListener("input", renderCards);

  // -----------------------------
  // Login
  // -----------------------------
  btnLogin?.addEventListener("click", async () => {
    const p = adminPass?.value?.trim() || "";
    if (p !== ADMIN_PASSWORD) {
      setStatus("รหัสผ่านไม่ถูกต้อง", false);
      return;
    }

    if (loginBox) loginBox.style.display = "none";
    if (adminPanel) {
      adminPanel.style.display = "block";
      adminPanel.classList.remove("hidden");
    }

    setStatus("เข้าสู่ระบบสำเร็จ");
    await loadList();
  });

  // -----------------------------
  // ✅ Actions buttons on cards
  // -----------------------------
  tableWrap?.addEventListener("click", async (e) => {
    const btn = e.target.closest("button[data-act]");
    if (!btn) return;

    const act = btn.dataset.act;

    try {
      if (act === "del") {
        const id = btn.dataset.id;
        if (!confirm("ต้องการลบรายการนี้ใช่ไหม?")) return;

        const data = await apiPost({ action: "adminDelete", id });
        if (!data.ok) return alert("❌ " + (data.message || "ลบไม่สำเร็จ"));

        await loadList();
      }

      if (act === "unlock") {
        const zone = btn.dataset.zone;
        const tableNo = btn.dataset.table;
        if (!confirm(`ต้องการปลดโต๊ะ ${zone}${tableNo} ใช่ไหม?`)) return;

        const data = await apiPost({ action: "adminUnlock", zone, tableNo });
        if (!data.ok) return alert("❌ " + (data.message || "ปลดไม่สำเร็จ"));

        await loadList();
      }

      if (act === "edit") {
        const id = btn.dataset.id;
        const row = ALL.find(x => String(x.id) === String(id));
        if (!row) return;

        editId.value = row.id;
        editZone.value = row.zone || "";
        editTableNo.value = row.tableNo || "";
        editBookerName.value = row.bookerName || "";
        editStudentName.value = row.studentName || "";
        editTeacher.value = row.homeroomTeacher || "";
        editPhone.value = row.phone || "";

        if (modalStatus) modalStatus.textContent = "";
        openModal();
      }
    } catch (err) {
      console.error(err);
      alert("❌ ทำรายการไม่สำเร็จ\n" + (err.message || ""));
    }
  });

  // -----------------------------
  // Save edit
  // -----------------------------
  btnSaveEdit?.addEventListener("click", async () => {
    try {
      if (modalStatus) modalStatus.textContent = "⏳ กำลังบันทึก...";

      const payload = {
        action: "adminUpdate",
        id: editId.value,
        zone: editZone.value.trim(),
        tableNo: editTableNo.value.trim(),
        bookerName: editBookerName.value.trim(),
        studentName: editStudentName.value.trim(),
        homeroomTeacher: editTeacher.value.trim(),
        phone: normalizePhone(editPhone.value.trim())
      };

      const data = await apiPost(payload);
      if (!data.ok) throw new Error(data.message || "บันทึกไม่สำเร็จ");

      closeModal();
      await loadList();
    } catch (err) {
      console.error(err);
      if (modalStatus) modalStatus.textContent = "❌ " + (err.message || "");
      alert("❌ บันทึกไม่สำเร็จ\n" + (err.message || ""));
    }
  });
});
