// ✅ วาง URL /exec ของ Apps Script Web App ของคุณ
const WEB_APP_URL ="https://script.google.com/macros/s/AKfycbw354eehe0zKpQIvgTRsCLEVnvnT7_U5dNnwVjw4icxw9S9I6U8NEKzTUGRlPoaw18/exec";

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
 * ✅ วางปุ่มแบบ Responsive (แก้ปัญหามือถือปุ่มซ้อน)
 * - ปรับตำแหน่งจากพื้นที่ Grid บนรูป (เป็น %)
 * - ถ้าตำแหน่งไม่เป๊ะ ให้จูน GRID_* ได้
 */
function renderButtons(bookedSet) {
  layer.innerHTML = "";
  zoneHidden.value = "";
  tableNoHidden.value = "";
  chooseText.textContent = "ยังไม่เลือกโต๊ะ";

  // ✅ กำหนดกรอบพื้นที่สำหรับวางปุ่มบนรูป (หน่วย %)
  // 📌 สามารถจูน 4 ตัวนี้ให้ตรงรูปมากขึ้นได้
  const GRID_LEFT = 12;  // ระยะซ้าย
  const GRID_TOP = 14;   // ระยะบน
  const GRID_W = 76;     // ความกว้างพื้นที่วางปุ่ม
  const GRID_H = 74;     // ความสูงพื้นที่วางปุ่ม

  const gapX = GRID_W / (COLS.length - 1);
  const gapY = GRID_H / (ROWS.length - 1);

  ROWS.forEach((row, rIndex) => {
    COLS.forEach((col, cIndex) => {
      const isBooked = bookedSet.has(key(col, row));

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "table-btn " + (isBooked ? "booked" : "free");
      btn.textContent = `${col}${row}`;

      // ✅ ตำแหน่งแบบ responsive
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

  // ✅ รอรูปโหลดก่อนค่อยวางปุ่ม (สำคัญมากสำหรับมือถือ)
  if (img && !img.complete) {
    img.onload = doRender;
  } else {
    doRender();
  }
}

// ✅ โหลดหลังรูป/ไฟล์ทั้งหมดพร้อมแล้ว
window.addEventListener("load", init);

// ✅ หมุนจอ/เปลี่ยนขนาด ให้จัดวางใหม่ ไม่ให้ปุ่มซ้อน
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
