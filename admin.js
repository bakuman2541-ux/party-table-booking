// =============================
// Party Table Booking - admin.js
// ✅ วางทับได้ทั้งไฟล์
// ✅ FIX: ปุ่มแก้ไข/ลบ/ปลดโต๊ะ Failed to fetch (CORS preflight)
// ✅ FIX: เวลาไม่ขึ้น (createdAt/timestamp)
// =============================

const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbwYzPY2VcEjofjF_Kh4tNu0yjRjyGjPB8ykxBWVupLx8pdNB6_CPuGAHCQXo2bFXVkQ/exec";
const ADMIN_PASSWORD = "bsr1234";

let ALL = [];
let VIEW = [];

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

async function apiGet(action) {
  const res = await fetch(`${WEB_APP_URL}?action=${encodeURIComponent(action)}`);
  return await res.json();
}

/* =====================================================
   ✅ FIX สำคัญ: POST แบบ x-www-form-urlencoded
   - กัน CORS preflight ที่ทำให้ Failed to fetch
===================================================== */
async function apiPost(bodyObj) {
  const form = new URLSearchParams();
  Object.entries(bodyObj || {}).forEach(([k, v]) => form.append(k, String(v ?? "")));

  const res = await fetch(WEB_APP_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
    body: form.toString(),
  });

  return await res.json();
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
    setTimeout(() => {
      const first = editModal.querySelector("input,button,textarea,select");
      if (first) first.focus();
    }, 30);
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
      renderCards();
    } catch (err) {
      console.error(err);
      setStatus(err.message || "โหลดข้อมูลไม่สำเร็จ", false);
      alert("❌ โหลดข้อมูลไม่สำเร็จ\n" + (err.message || ""));
    }
  }

  tableWrap?.addEventListener("click", async (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;

    const act = btn.dataset.act;

    if (act === "del") {
      const id = btn.dataset.id;
      if (!confirm("ยืนยันลบรายการนี้?")) return;
      const res = await apiPost({ action: "adminDelete", id });
      if (!res.ok) return alert("❌ ลบไม่สำเร็จ: " + (res.message || ""));
      await loadList();
    }

    if (act === "unlock") {
      const zone = btn.dataset.zone;
      const tableNo = btn.dataset.table;
      if (!confirm(`ยืนยันปลดโต๊ะ แถว ${zone} โต๊ะ ${tableNo}?`)) return;
      const res = await apiPost({ action: "adminUnlock", zone, tableNo });
      if (!res.ok) return alert("❌ ปลดโต๊ะไม่สำเร็จ: " + (res.message || ""));
      await loadList();
    }

    if (act === "edit") {
      const id = btn.dataset.id;
      const row = ALL.find(x => String(x.id) === String(id));
      if (!row) return alert("ไม่พบข้อมูลรายการนี้");

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
  });

  btnSaveEdit?.addEventListener("click", async () => {
    try {
      modalStatus.textContent = "⏳ กำลังบันทึก...";
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
      closeModal();
      await loadList();
    } catch (err) {
      console.error(err);
      modalStatus.textContent = "❌ " + (err.message || "บันทึกไม่สำเร็จ");
    }
  });

  btnLogin?.addEventListener("click", async () => {
    const p = adminPass.value.trim();
    if (p !== ADMIN_PASSWORD) {
      setStatus("รหัสผ่านไม่ถูกต้อง", false);
      return;
    }

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
