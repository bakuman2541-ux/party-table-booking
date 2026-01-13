// ✅ วาง URL /exec ของ Apps Script Web App ของคุณ
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbw354eehe0zKpQIvgTRsCLEVnvnT7_U5dNnwVjw4icxw9S9I6U8NEKzTUGRlPoaw18/exec";

/* ===================================================
   ✅ ตั้งราคาโต๊ะ
=================================================== */
const TABLE_PRICE = 2700; // ✅ เปลี่ยนราคาได้เลย
const PRICE_BY_ZONE = {
  // A: 3000,
  // B: 2700,
  // C: 2500,
};

function getPrice(zone, tableNo) {
  if (PRICE_BY_ZONE && PRICE_BY_ZONE[zone] != null) return Number(PRICE_BY_ZONE[zone]);
  return Number(TABLE_PRICE);
}

function money(n) {
  const x = Number(n || 0);
  return x.toLocaleString("th-TH");
}

const layer = document.getElementById("buttonsLayer");
const chooseText = document.getElementById("chooseText");
const statusEl = document.getElementById("status");

const zoneHidden = document.getElementById("zone");
const tableNoHidden = document.getElementById("tableNo");

const bookingForm = document.getElementById("bookingForm");

// ✅ ตัวเลขสรุป (จองแล้ว/ว่าง/ทั้งหมด)
const countBookedEl = document.getElementById("countBooked");
const countFreeEl = document.getElementById("countFree");
const countTotalEl = document.getElementById("countTotal");

// ✅ แนวนอน A-J / แนวตั้ง 1-13
const COLS = "ABCDEFGHIJ".split("");
const ROWS = Array.from({ length: 13 }, (_, i) => i + 1);

// ✅ ปรับตำแหน่งให้ตรงรูป
const START_X = 22;
const START_Y = 24;
const GAP_X = 6.0;
const GAP_Y = 6.0;

function key(zone, tableNo) {
  return `${zone}-${tableNo}`;
}

/* ===========================
   ✅ ซ่อน/โชว์ฟอร์ม
=========================== */
function showForm() {
  if (!bookingForm) return;
  bookingForm.classList.remove("is-hidden");
}

function hideForm() {
  if (!bookingForm) return;
  bookingForm.classList.add("is-hidden");
}

/* ===========================
   ✅ การ์ดแสดงผลเลือกโต๊ะ
=========================== */
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

async function loadBookedAll() {
  try {
    const res = await fetch(`${WEB_APP_URL}?action=bookedAll`);
    const data = await res.json();

    const bookedSet = new Set();
    (data.booked || []).forEach(item => bookedSet.add(key(item.zone, item.tableNo)));
    return bookedSet;
  } catch (err) {
    console.error("loadBookedAll error:", err);
    return new Set();
  }
}

function renderButtons(bookedSet) {
  layer.innerHTML = "";
  zoneHidden.value = "";
  tableNoHidden.value = "";

  // ✅ หน้าแรก: ซ่อนฟอร์ม
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

        const price = getPrice(col, row);

        renderSelectedCard({
          zone: col,
          tableNo: row,
          price
        });

        // ✅ เลือกโต๊ะแล้ว: แสดงฟอร์ม
        showForm();

        // ✅ เลื่อนลงหาฟอร์มแบบนุ่มๆ
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

  // ✅ คำนวณจำนวนโต๊ะ (จองแล้ว/ว่าง/ทั้งหมด)
  const total = COLS.length * ROWS.length;
  const booked = bookedSet.size;
  const free = total - booked;

  if (countTotalEl) countTotalEl.textContent = total;
  if (countBookedEl) countBookedEl.textContent = booked;
  if (countFreeEl) countFreeEl.textContent = free;

  statusEl.textContent = "✅ พร้อมจองโต๊ะ";
}

document.addEventListener("DOMContentLoaded", init);

bookingForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!zoneHidden.value || !tableNoHidden.value) {
    statusEl.textContent = "❌ กรุณาเลือกโต๊ะก่อน";
    return;
  }

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

    if (!res.ok) {
      statusEl.textContent = "❌ บันทึกไม่สำเร็จ (HTTP " + res.status + ")";
      return;
    }

    statusEl.textContent = "✅ จองสำเร็จ!";
    bookingForm.reset();

    // ✅ จองแล้วโหลดผังใหม่ และกลับไปซ่อนฟอร์ม (ต้องเลือกโต๊ะใหม่)
    await init();
  } catch (err) {
    console.error(err);
    statusEl.textContent = "❌ Error: ไม่สามารถเชื่อมต่อได้";
  }
});
