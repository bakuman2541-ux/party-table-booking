// ✅ วาง URL /exec ของ Apps Script Web App ของคุณ
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbw354eehe0zKpQIvgTRsCLEVnvnT7_U5dNnwVjw4icxw9S9I6U8NEKzTUGRlPoaw18/exec";

const layer = document.getElementById("buttonsLayer");
const chooseText = document.getElementById("chooseText");
const statusEl = document.getElementById("status");

const zoneHidden = document.getElementById("zone");
const tableNoHidden = document.getElementById("tableNo");

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
  chooseText.textContent = "ยังไม่เลือกโต๊ะ";

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
        chooseText.textContent = `✅ เลือกโต๊ะ: แถว ${col} โต๊ะ ${row}`;
      });

      layer.appendChild(btn);
    });
  });
}

async function init() {
  statusEl.textContent = "⏳ กำลังโหลดผังโต๊ะ...";
  const bookedSet = await loadBookedAll();
  renderButtons(bookedSet);
  statusEl.textContent = "✅ พร้อมจองโต๊ะ";
}

document.addEventListener("DOMContentLoaded", init);

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

    // ✅ ถึงอ่าน JSON ไม่ได้เพราะ CORS ก็ยังให้ถือว่าบันทึกแล้ว แล้วค่อยโหลดใหม่
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
