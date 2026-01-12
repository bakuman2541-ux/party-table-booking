// ✅ ใช้ URL เดียวกับหน้าจอง (ต้องเป็นของคุณ)
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbw354eehe0zKpQIvgTRsCLEVnvnT7_U5dNnwVjw4icxw9S9I6U8NEKzTUGRlPoaw18/exec";

// รหัสผ่านแอดมินแบบง่าย (ถ้าต้องการปลอดภัยจริงต้องตรวจใน Apps Script)
const ADMIN_PASSWORD = "Bsr@2026";

const loginBox = document.getElementById("loginBox");
const adminPanel = document.getElementById("adminPanel");
const adminStatus = document.getElementById("adminStatus");
const adminStatus2 = document.getElementById("adminStatus2");
const tableWrap = document.getElementById("tableWrap");
const searchBox = document.getElementById("searchBox");

// ===== Modal refs =====
const editModal = document.getElementById("editModal");
const modalStatus = document.getElementById("modalStatus");

const editId = document.getElementById("editId");
const editZone = document.getElementById("editZone");
const editTableNo = document.getElementById("editTableNo");
const editBookerName = document.getElementById("editBookerName");
const editStudentName = document.getElementById("editStudentName");
const editTeacher = document.getElementById("editTeacher");
const editPhone = document.getElementById("editPhone");

let BOOKINGS = [];

function escapeHtml(s = "") {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function setStatus(el, msg) {
  el.textContent = msg || "";
}

function isLoggedIn() {
  return sessionStorage.getItem("adminLoggedIn") === "1";
}

function showPanel() {
  loginBox.style.display = "none";
  adminPanel.style.display = "block";
}

function showLogin() {
  loginBox.style.display = "block";
  adminPanel.style.display = "none";
}

function openModal() {
  editModal.style.display = "grid";
}
function closeModal() {
  editModal.style.display = "none";
  modalStatus.textContent = "";
}

document.getElementById("btnCloseModal").addEventListener("click", closeModal);
editModal.addEventListener("click", (e) => {
  if (e.target === editModal) closeModal();
});

async function loadBookings() {
  setStatus(adminStatus2, "⏳ กำลังโหลดข้อมูล...");

  const res = await fetch(`${WEB_APP_URL}?action=adminList`);
  const data = await res.json();

  BOOKINGS = data.bookings || [];
  renderTable(BOOKINGS);
  setStatus(adminStatus2, `✅ โหลดแล้ว ${BOOKINGS.length} รายการ`);
}

function renderTable(items) {
  if (!items.length) {
    tableWrap.innerHTML = `<p style="color:#6b7280; font-weight:700;">ยังไม่มีรายการจอง</p>`;
    return;
  }

  const html = `
    <table style="width:100%; border-collapse:collapse; font-size:14px;">
      <thead>
        <tr style="text-align:left; border-bottom:1px solid rgba(0,0,0,0.1);">
          <th style="padding:10px;">โต๊ะ</th>
          <th style="padding:10px;">ผู้จอง</th>
          <th style="padding:10px;">นักเรียน</th>
          <th style="padding:10px;">ชั้น</th>
          <th style="padding:10px;">ครู</th>
          <th style="padding:10px;">เบอร์</th>
          <th style="padding:10px;">จัดการ</th>
        </tr>
      </thead>
      <tbody>
        ${items.map(row => `
          <tr style="border-bottom:1px solid rgba(0,0,0,0.06);">
            <td style="padding:10px; font-weight:900;">${escapeHtml(row.zone)}${escapeHtml(row.tableNo)}</td>
            <td style="padding:10px;">${escapeHtml(row.bookerName)}</td>
            <td style="padding:10px;">${escapeHtml(row.studentName)}</td>
            <td style="padding:10px;">${escapeHtml(row.classLevel)}</td>
            <td style="padding:10px;">${escapeHtml(row.homeroomTeacher)}</td>
            <td style="padding:10px;">${escapeHtml(row.phone)}</td>
            <td style="padding:10px; white-space:nowrap;">
              <button class="btnSmall" data-act="edit" data-id="${escapeHtml(row.id)}">✏️ แก้ไข</button>
              <button class="btnSmall" data-act="delete" data-id="${escapeHtml(row.id)}">🗑️ ลบ</button>
              <button class="btnSmall" data-act="unlock" data-zone="${escapeHtml(row.zone)}" data-table="${escapeHtml(row.tableNo)}">🔓 ปลดโต๊ะ</button>
            </td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;

  tableWrap.innerHTML = html;
}

function filterData() {
  const q = (searchBox.value || "").trim().toLowerCase();
  if (!q) return renderTable(BOOKINGS);

  const filtered = BOOKINGS.filter(r => {
    const text = `${r.zone}${r.tableNo} ${r.bookerName} ${r.studentName} ${r.classLevel} ${r.homeroomTeacher} ${r.phone}`.toLowerCase();
    return text.includes(q);
  });

  renderTable(filtered);
}

async function adminDelete(id) {
  if (!confirm("ต้องการลบรายการนี้ใช่ไหม?")) return;

  setStatus(adminStatus2, "⏳ กำลังลบ...");
  const fd = new FormData();
  fd.append("action", "adminDelete");
  fd.append("id", id);

  const res = await fetch(WEB_APP_URL, { method: "POST", body: fd });
  const data = await res.json().catch(() => null);

  if (!res.ok || !data?.ok) {
    setStatus(adminStatus2, "❌ ลบไม่สำเร็จ: " + (data?.message || `HTTP ${res.status}`));
    return;
  }

  setStatus(adminStatus2, "✅ ลบแล้ว");
  await loadBookings();
}

async function adminUnlock(zone, tableNo) {
  if (!confirm(`ต้องการปลดโต๊ะ ${zone}${tableNo} ใช่ไหม?`)) return;

  setStatus(adminStatus2, "⏳ กำลังปลดโต๊ะ...");
  const fd = new FormData();
  fd.append("action", "adminUnlock");
  fd.append("zone", zone);
  fd.append("tableNo", tableNo);

  const res = await fetch(WEB_APP_URL, { method: "POST", body: fd });
  const data = await res.json().catch(() => null);

  if (!res.ok || !data?.ok) {
    setStatus(adminStatus2, "❌ ปลดโต๊ะไม่สำเร็จ: " + (data?.message || `HTTP ${res.status}`));
    return;
  }

  setStatus(adminStatus2, "✅ ปลดโต๊ะแล้ว");
  await loadBookings();
}

async function adminEdit(id) {
  const row = BOOKINGS.find(x => String(x.id) === String(id));
  if (!row) return;

  editId.value = row.id;
  editZone.value = row.zone || "";
  editTableNo.value = row.tableNo || "";
  editBookerName.value = row.bookerName || "";
  editStudentName.value = row.studentName || "";
  editTeacher.value = row.homeroomTeacher || "";
  editPhone.value = row.phone || "";

  openModal();
}

document.getElementById("btnSaveEdit").addEventListener("click", async () => {
  const id = (editId.value || "").trim();
  const zone = (editZone.value || "").trim();
  const tableNo = (editTableNo.value || "").trim();
  const bookerName = (editBookerName.value || "").trim();
  const studentName = (editStudentName.value || "").trim();
  const homeroomTeacher = (editTeacher.value || "").trim();
  const phone = (editPhone.value || "").trim();

  if (!zone || !tableNo) {
    modalStatus.textContent = "❌ กรุณากรอกโซนและเลขโต๊ะ";
    return;
  }

  modalStatus.textContent = "⏳ กำลังบันทึก...";

  const fd = new FormData();
  fd.append("action", "adminUpdate");
  fd.append("id", id);
  fd.append("zone", zone);
  fd.append("tableNo", tableNo);
  fd.append("bookerName", bookerName);
  fd.append("studentName", studentName);
  fd.append("homeroomTeacher", homeroomTeacher);
  fd.append("phone", phone);

  const res = await fetch(WEB_APP_URL, { method: "POST", body: fd });
  const data = await res.json().catch(() => null);

  if (!res.ok || !data?.ok) {
    modalStatus.textContent = "❌ บันทึกไม่สำเร็จ: " + (data?.message || `HTTP ${res.status}`);
    return;
  }

  modalStatus.textContent = "✅ บันทึกสำเร็จ";
  await loadBookings();
  closeModal();
});

document.addEventListener("click", async (e) => {
  const btn = e.target.closest("button[data-act]");
  if (!btn) return;

  const act = btn.dataset.act;

  if (act === "delete") return adminDelete(btn.dataset.id);
  if (act === "edit") return adminEdit(btn.dataset.id);
  if (act === "unlock") return adminUnlock(btn.dataset.zone, btn.dataset.table);
});

document.getElementById("btnLogin").addEventListener("click", async () => {
  const pass = (document.getElementById("adminPass").value || "").trim();
  if (pass !== ADMIN_PASSWORD) {
    setStatus(adminStatus, "❌ รหัสผ่านไม่ถูกต้อง");
    return;
  }

  sessionStorage.setItem("adminLoggedIn", "1");
  setStatus(adminStatus, "✅ เข้าสู่ระบบสำเร็จ");
  showPanel();
  await loadBookings();
});

document.getElementById("btnReload").addEventListener("click", async () => {
  if (!isLoggedIn()) return;
  await loadBookings();
});

searchBox.addEventListener("input", filterData);

window.addEventListener("DOMContentLoaded", async () => {
  if (isLoggedIn()) {
    showPanel();
    await loadBookings();
  } else {
    showLogin();
  }
});
