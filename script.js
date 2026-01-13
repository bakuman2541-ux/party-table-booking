const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbw354eehe0zKpQIvgTRsCLEVnvnT7_U5dNnwVjw4icxw9S9I6U8NEKzTUGRlPoaw18/exec";

const TABLE_PRICE = 2700;
const PRICE_BY_ZONE = {}; // ถ้าต้องการตั้งราคาตามโซน

function getPrice(zone) {
  if (PRICE_BY_ZONE && PRICE_BY_ZONE[zone] != null) return Number(PRICE_BY_ZONE[zone]);
  return Number(TABLE_PRICE);
}
function money(n) {
  return Number(n || 0).toLocaleString("th-TH");
}

const layer = document.getElementById("buttonsLayer");
const chooseText = document.getElementById("chooseText");
const statusEl = document.getElementById("status");

const zoneHidden = document.getElementById("zone");
const tableNoHidden = document.getElementById("tableNo");

const bookingForm = document.getElementById("bookingForm");
const btnSubmit = document.getElementById("btnSubmit");

const countBookedEl = document.getElementById("countBooked");
const countFreeEl = document.getElementById("countFree");
const countTotalEl = document.getElementById("countTotal");

const tableSearchEl = document.getElementById("tableSearch");
const btnFindTable = document.getElementById("btnFindTable");
const btnClearFind = document.getElementById("btnClearFind");

const confirmOverlay = document.getElementById("confirmOverlay");
const btnCloseModal = document.getElementById("btnCloseModal");
const btnCancelModal = document.getElementById("btnCancelModal");
const btnConfirmModal = document.getElementById("btnConfirmModal");

const mTable = document.getElementById("mTable");
const mPrice = document.getElementById("mPrice");
const mBooker = document.getElementById("mBooker");
const mStudent = document.getElementById("mStudent");
const mClass = document.getElementById("mClass");
const mTeacher = document.getElementById("mTeacher");
const mPhone = document.getElementById("mPhone");

const COLS = "ABCDEFGHIJ".split("");
const ROWS = Array.from({ length: 13 }, (_, i) => i + 1);

const START_X = 22;
const START_Y = 24;
const GAP_X = 6.0;
const GAP_Y = 6.0;

function key(zone, tableNo) {
  return `${zone}-${tableNo}`;
}

function showForm() {
  bookingForm?.classList.remove("is-hidden");
}
function hideForm() {
  bookingForm?.classList.add("is-hidden");
}

/* ✅ กล่องเลือกโต๊ะ+ราคา (สวยขึ้น) */
function renderSelectedCard({ zone, tableNo, price }) {
  if (!zone || !tableNo) {
    chooseText.innerHTML = `
      <div class="si-icon">☑️</div>
      <div class="si-body">
        <div class="si-title">ยังไม่เลือกโต๊ะ</div>
        <div class="si-sub">กรุณาคลิกเลือกโต๊ะจากผังด้านบน เพื่อกรอกข้อมูลผู้จอง</div>
      </div>
      <div class="si-price" style="opacity:.35">
        <span class="coin">💰</span>
        ราคา <b>0</b> บาท
      </div>
    `;
    return;
  }

  chooseText.innerHTML = `
    <div class="si-icon">✅</div>
    <div class="si-body">
      <div class="si-title">เลือกโต๊ะเรียบร้อย</div>
      <div class="si-sub">
        <span class="si-seat">🪑 แถว <b>${zone}</b> โต๊ะ <b>${tableNo}</b></span>
      </div>
    </div>
    <div class="si-price">
      <span class="coin">💰</span>
      ราคา <b>${money(price)}</b> บาท
    </div>
  `;
}

function clearSelected() {
  document.querySelectorAll(".table-btn.selected").forEach((x) => {
    x.classList.remove("selected");
    if (!x.disabled) x.classList.add("free");
  });
}

function clearFoundMark() {
  document.querySelectorAll(".table-btn.table-found").forEach((x) => x.classList.remove("table-found"));
}

function setLoading(isLoading) {
  if (!btnSubmit) return;
  btnSubmit.disabled = isLoading;
  btnSubmit.textContent = isLoading ? "⏳ กำลังบันทึก..." : "✅ ยืนยันการจอง";
}

async function loadBookedAll() {
  try {
    const res = await fetch(`${WEB_APP_URL}?action=bookedAll`);
    const data = await res.json();
    const bookedSet = new Set();
    (data.booked || []).forEach(item => bookedSet.add(key(item.zone, item.tableNo)));
    return bookedSet;
  } catch (err) {
    console.error(err);
    return new Set();
  }
}

function renderButtons(bookedSet) {
  layer.innerHTML = "";
  zoneHidden.value = "";
  tableNoHidden.value = "";

  hideForm();
  renderSelectedCard({ zone: "", tableNo: "", price: 0 });

  ROWS.forEach((row, rIndex) => {
    COLS.forEach((col, cIndex) => {
      const isBooked = bookedSet.has(key(col, row));

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "table-btn " + (isBooked ? "booked" : "free");
      btn.textContent = `${col}${row}`;

      btn.style.left = (START_X + cIndex * GAP_X) + "%";
      btn.style.top = (START_Y + rIndex * GAP_Y) + "%";

      if (isBooked) btn.disabled = true;

      btn.addEventListener("click", () => {
        if (btn.disabled) return;

        clearSelected();
        btn.classList.remove("free");
        btn.classList.add("selected");

        zoneHidden.value = col;
        tableNoHidden.value = String(row);

        const price = getPrice(col);
        renderSelectedCard({ zone: col, tableNo: row, price });

        showForm();
        bookingForm?.scrollIntoView({ behavior: "smooth", block: "start" });
      });

      layer.appendChild(btn);
    });
  });
}

async function init() {
  statusEl.textContent = "⏳ กำลังโหลดผังโต๊ะ...";

  const bookedSet = await loadBookedAll();
  renderButtons(bookedSet);

  const total = COLS.length * ROWS.length;
  const booked = bookedSet.size;
  const free = total - booked;

  countTotalEl.textContent = total;
  countBookedEl.textContent = booked;
  countFreeEl.textContent = free;

  statusEl.textContent = "✅ พร้อมจองโต๊ะ";
}
document.addEventListener("DOMContentLoaded", init);

/* ✅ Search โต๊ะ */
function normalizeTableInput(v) {
  return String(v || "").trim().toUpperCase().replace(/\s+/g, "");
}
function findTable() {
  const q = normalizeTableInput(tableSearchEl.value);
  if (!q) return;

  clearFoundMark();

  const btn = Array.from(document.querySelectorAll(".table-btn"))
    .find(b => String(b.textContent).trim().toUpperCase() === q);

  if (!btn) {
    statusEl.textContent = "❌ ไม่พบโต๊ะ " + q;
    return;
  }

  btn.classList.add("table-found");
  btn.scrollIntoView({ behavior: "smooth", block: "center" });
  statusEl.textContent = "✅ พบโต๊ะ " + q + " แล้ว";
}

btnFindTable?.addEventListener("click", findTable);
tableSearchEl?.addEventListener("keydown", (e) => { if (e.key === "Enter") findTable(); });

btnClearFind?.addEventListener("click", () => {
  tableSearchEl.value = "";
  clearFoundMark();
  statusEl.textContent = "✅ พร้อมจองโต๊ะ";
});

/* ✅ Modal */
function openModal() { confirmOverlay.classList.remove("hidden"); }
function closeModal() { confirmOverlay.classList.add("hidden"); }

btnCloseModal?.addEventListener("click", closeModal);
btnCancelModal?.addEventListener("click", closeModal);
confirmOverlay?.addEventListener("click", (e) => { if (e.target === confirmOverlay) closeModal(); });

function fillModal() {
  const zone = zoneHidden.value;
  const tableNo = tableNoHidden.value;
  const price = getPrice(zone);

  mTable.textContent = `${zone}${tableNo}`;
  mPrice.textContent = `${money(price)} บาท`;

  mBooker.textContent = document.getElementById("bookerName").value.trim();
  mStudent.textContent = document.getElementById("studentName").value.trim();
  mClass.textContent = document.getElementById("classLevel").value.trim();
  mTeacher.textContent = document.getElementById("homeroomTeacher").value.trim();
  mPhone.textContent = document.getElementById("phone").value.trim();
}

/* ✅ Submit → เปิด modal */
bookingForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!zoneHidden.value || !tableNoHidden.value) {
    statusEl.textContent = "❌ กรุณาเลือกโต๊ะก่อน";
    return;
  }

  if (!bookingForm.checkValidity()) {
    bookingForm.reportValidity();
    return;
  }

  fillModal();
  openModal();
});

/* ✅ Confirm → บันทึกจริง */
btnConfirmModal?.addEventListener("click", async () => {
  closeModal();
  setLoading(true);
  statusEl.textContent = "⏳ กำลังบันทึก...";

  try {
    const fd = new FormData();
    fd.append("zone", zoneHidden.value);
    fd.append("tableNo", tableNoHidden.value);

    fd.append("bookerName", document.getElementById("bookerName").value.trim());
    fd.append("studentName", document.getElementById("studentName").value.trim());
    fd.append("classLevel", document.getElementById("classLevel").value.trim());
    fd.append("homeroomTeacher", document.getElementById("homeroomTeacher").value.trim());
    fd.append("phone", document.getElementById("phone").value.trim());

    const res = await fetch(WEB_APP_URL, { method: "POST", body: fd });
    const data = await res.json().catch(() => null);

    if (!res.ok || !data) {
      statusEl.textContent = "❌ บันทึกไม่สำเร็จ";
      return;
    }

    if (!data.ok) {
      if (data.code === "ALREADY_BOOKED") {
        statusEl.textContent = "❌ โต๊ะนี้ถูกจองไปแล้ว กรุณาเลือกใหม่";
        await init();
        return;
      }
      statusEl.textContent = "❌ บันทึกไม่สำเร็จ: " + (data.error || "");
      return;
    }

    statusEl.textContent = "✅ จองสำเร็จ!";
    bookingForm.reset();
    await init();

  } catch (err) {
    console.error(err);
    statusEl.textContent = "❌ Error: ไม่สามารถเชื่อมต่อได้";
  } finally {
    setLoading(false);
  }
});
