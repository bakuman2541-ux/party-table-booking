// ✅ วาง URL /exec ของ Apps Script Web App ของคุณ
const WEB_APP_URL =
  "https://script.google.com/macros/s/AKfycbw354eehe0zKpQIvgTRsCLEVnvnT7_U5dNnwVjw4icxw9S9I6U8NEKzTUGRlPoaw18/exec";

const layer = document.getElementById("buttonsLayer");
const chooseText = document.getElementById("chooseText");
const statusEl = document.getElementById("status");

const zoneHidden = document.getElementById("zone");
const tableNoHidden = document.getElementById("tableNo");

// ✅ แนวนอน A-J / แนวตั้ง 1-13
const COLS = "ABCDEFGHIJ".split("");
const ROWS = Array.from({ length: 13 }, (_, i) => i + 1);

function key(zone, tableNo) {
  return `${zone}-${tableNo}`;
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
    (data.booked || []).forEach((item) =>
      bookedSet.add(key(item.zone, item.tableNo))
    );

    return bookedSet;
  } catch (err) {
    console.error("loadBookedAll error:", err);
    return new Set();
  }
}

/**
 * ✅ วางปุ่มแบบ Responsive
 * - รองรับมือถือ / ปรับขนาดจอ / หมุนจอ
 * - ถ้าตำแหน่งยังเหลื่อม ให้ปรับ 4 ค่านี้ (GRID_*)
 */
function renderButtons(bookedSet) {
  layer.innerHTML = "";
  zoneHidden.value = "";
  tableNoHidden.value = "";
  chooseText.textContent = "ยังไม่เลือกโต๊ะ";

  // ✅ กรอบพื้นที่วางปุ่มบนรูป (หน่วย %)
  // 📌 จูนให้ตรงรูปได้โดยปรับ 4 ค่านี้
  const GRID_LEFT = 20;  // ขยับซ้าย-ขวา
  const GRID_TOP = 26;   // ขยับบน-ล่าง
  const GRID_W = 60;     // ความกว้างของกริด
  const GRID_H = 66;     // ความสูงของกริด

  const gapX = GRID_W / (COLS.length - 1);
  const gapY = GRID_H / (ROWS.length - 1);

  ROWS.forEach((row, rIndex) => {
    COLS.forEach((col, cIndex) => {
      const isBooked = bookedSet.has(key(col, row));

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "table-btn " + (isBooked ? "booked" : "free");
      btn.textContent = `${col}${row}`;

      // ✅ คำนวณตำแหน่งแบบ responsive
      btn.style.left = GRID_LEFT + cIndex * gapX + "%";
      btn.style.top = GRID_TOP + rIndex * gapY + "%";

      if (isBooked) btn.disabled = true;

      btn.addEventListener("click", () => {
        if (btn.disabled) return;

        clearSelected();
        btn.classList.remove("free");
        btn.classList.add("selected");

        zoneHidden.value = col;
        tableNoHidden.value = String(row);
        chooseText.textContent = `✅ เลือกโต๊ะ: แถว ${col} โต๊ะ ${row}`;
      });

      layer.appendChild(btn);
    });
  });
}

let lastBookedSet = new Set();

async function init() {
  statusEl.textContent = "⏳ กำลังโหลดผังโต๊ะ...";
  lastBookedSet = await loadBookedAll();

  const img = document.querySelector(".plan-img");

  const doRender = () => {
    renderButtons(lastBookedSet);
    statusEl.textContent = "✅ พร้อมจองโต๊ะ";
  };

  // ✅ รอรูปโหลดก่อน (มือถือจำเป็นมาก)
  if (img && !img.complete) {
    img.addEventListener("load", doRender, { once: true });
  } else {
    doRender();
  }
}

// ✅ เปลี่ยนจาก DOMContentLoaded → load (ให้แน่ใจว่ารูปโหลดก่อน)
window.addEventListener("load", init);

// ✅ หมุนจอ/เปลี่ยนขนาดจอ ให้จัดวางปุ่มใหม่
window.addEventListener("resize", () => {
  renderButtons(lastBookedSet);
});

document.getElementById("bookingForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!zoneHidden.value || !tableNoHidden.value) {
    statusEl.textContent = "❌ กรุณาเลือกโต๊ะก่อน";
    return;
  }

  const payload = {
    zone: zoneHidden.value,
    tableNo: tableNoHidden.value,
    bookerName: document.getElementById("bookerName").value.trim(),
    studentName: document.getElementById("studentName").value.trim(),
    classLevel: document.getElementById("classLevel").value.trim(),
    homeroomTeacher: document.getElementById("homeroomTeacher").value.trim(),
    phone: document.getElementById("phone").value.trim(),
  };

  statusEl.textContent = "⏳ กำลังบันทึก...";

  try {
    // ✅ ส่งแบบ FormData (แก้ CORS)
    const fd = new FormData();
    fd.append("zone", payload.zone);
    fd.append("tableNo", payload.tableNo);
    fd.append("bookerName", payload.bookerName);
    fd.append("studentName", payload.studentName);
    fd.append("classLevel", payload.classLevel);
    fd.append("homeroomTeacher", payload.homeroomTeacher);
    fd.append("phone", payload.phone);

    const res = await fetch(WEB_APP_URL, {
      method: "POST",
      body: fd,
    });

    if (!res.ok) {
      statusEl.textContent = "❌ บันทึกไม่สำเร็จ (HTTP " + res.status + ")";
      return;
    }

    statusEl.textContent = "✅ จองสำเร็จ!";
    document.getElementById("bookingForm").reset();

    await init();
  } catch (err) {
    console.error(err);
    statusEl.textContent = "❌ Error: ไม่สามารถเชื่อมต่อได้";
  }
});
