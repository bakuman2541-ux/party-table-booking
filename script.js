const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbw354eehe0zKpQIvgTRsCLEVnvnT7_U5dNnwVjw4icxw9S9I6U8NEKzTUGRlPoaw18/exec";

const TABLE_PRICE = 2700;
const PRICE_BY_ZONE = {}; // ตั้งราคาตามโซนได้

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

function setStatus(msg = "", ok = true) {
  if (!statusEl) return;
  statusEl.textContent = msg;
  statusEl.style.color = ok ? "#065f46" : "#b91c1c";
}

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

  ROWS.forEach((row) => {
    COLS.forEach((col, cIndex) => {
      const isBooked = bookedSet.has(key(col, row));

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "table-btn " + (isBooked ? "booked" : "free");
      btn.textContent = `${col}${row}`;

      btn.style.left = (START_X + cIndex * GAP_X) + "%";
      btn.style.top = (START_Y + (row - 1) * GAP_Y) + "%";

      if (isBooked) btn.disabled = true;

      btn.addEventListener("click", () => {
        if (btn.disabled) return;

        clearSelected();
        btn.classList.remove("free");
        btn.classList.add("selected");

        zoneHidden.value = col;
        tableNoHidden.value = row;

        showForm();
        const price = getPrice(col);
        renderSelectedCard({ zone: col, tableNo: row, price });
        setStatus("");

        bookingForm?.scrollIntoView({ behavior: "smooth", block: "start" });
      });

      layer.appendChild(btn);
    });
  });
}

function updateCounts(bookedSet) {
  const booked = bookedSet.size;
  const total = COLS.length * ROWS.length;
  const free = Math.max(0, total - booked);

  if (countBookedEl) countBookedEl.textContent = booked;
  if (countTotalEl) countTotalEl.textContent = total;
  if (countFreeEl) countFreeEl.textContent = free;
}

// Search โต๊ะ
function findTable() {
  const q = (tableSearchEl?.value || "").trim().toUpperCase();
  clearFoundMark();
  if (!q) return;

  const found = [...document.querySelectorAll(".table-btn")].find(b => b.textContent.trim() === q);
  if (!found) {
    alert("ไม่พบโต๊ะนี้");
    return;
  }

  found.classList.add("table-found");
  found.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
}

btnFindTable?.addEventListener("click", findTable);
btnClearFind?.addEventListener("click", () => {
  tableSearchEl.value = "";
  clearFoundMark();
});

// ✅ Submit (ไม่มี confirm แล้ว)
bookingForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const zone = (zoneHidden.value || "").trim();
  const tableNo = (tableNoHidden.value || "").trim();

  if (!zone || !tableNo) return alert("กรุณาเลือกโต๊ะก่อน");

  const bookerName = document.getElementById("bookerName").value.trim();
  const studentName = document.getElementById("studentName").value.trim();
  const classLevel = document.getElementById("classLevel").value.trim();
  const homeroomTeacher = document.getElementById("homeroomTeacher").value.trim();
  const phone = document.getElementById("phone").value.trim();

  if (!bookerName || !studentName || !classLevel || !homeroomTeacher || !phone) {
    return alert("กรุณากรอกข้อมูลให้ครบ");
  }

  try {
    setLoading(true);
    setStatus("⏳ กำลังบันทึก...", true);

    const fd = new FormData();
    fd.append("action", "book");
    fd.append("zone", zone);
    fd.append("tableNo", tableNo);
    fd.append("price", getPrice(zone));
    fd.append("bookerName", bookerName);
    fd.append("studentName", studentName);
    fd.append("classLevel", classLevel);
    fd.append("homeroomTeacher", homeroomTeacher);
    fd.append("phone", phone);

    const res = await fetch(WEB_APP_URL, { method: "POST", body: fd });
    const text = await res.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error("API ไม่ได้ส่ง JSON: " + text);
    }

    if (!data.ok) {
      setStatus("❌ จองไม่สำเร็จ: " + (data.message || "unknown"), false);
      return;
    }

    setStatus("✅ จองสำเร็จแล้ว!", true);

    bookingForm.reset();
    hideForm();

    const bookedSet = await loadBookedAll();
    updateCounts(bookedSet);
    renderButtons(bookedSet);

  } catch (err) {
    console.error(err);
    setStatus("❌ เกิดข้อผิดพลาด: " + (err.message || err), false);
  } finally {
    setLoading(false);
  }
});

// Init
(async function init() {
  const bookedSet = await loadBookedAll();
  updateCounts(bookedSet);
  renderButtons(bookedSet);
})();
