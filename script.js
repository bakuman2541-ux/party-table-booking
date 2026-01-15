const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbwYzPY2VcEjofjF_Kh4tNu0yjRjyGjPB8ykxBWVupLx8pdNB6_CPuGAHCQXo2bFXVkQ/exec";

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

const COLS = "ABCDEFGHIJ".split("");
const ROWS = Array.from({ length: 13 }, (_, i) => i + 1);

const START_X = 22;
const START_Y = 24;
const GAP_X = 6.0;
const GAP_Y = 6.0;

/* =============================
   ✅ Toast แจ้งเตือนผู้ใช้
============================= */
function ensureToast_() {
  if (document.getElementById("toastWrap")) return;

  const wrap = document.createElement("div");
  wrap.id = "toastWrap";
  wrap.style.cssText = `
    position: fixed; right: 16px; bottom: 16px; z-index: 999999;
    display: flex; flex-direction: column; gap: 10px;
    max-width: min(420px, calc(100vw - 24px));
  `;
  document.body.appendChild(wrap);
}

function toast(msg, type = "info", ms = 2600) {
  ensureToast_();

  const el = document.createElement("div");
  el.style.cssText = `
    padding: 12px 14px;
    border-radius: 14px;
    box-shadow: 0 16px 30px rgba(0,0,0,.12);
    font-weight: 900;
    background: rgba(255,255,255,.92);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(0,0,0,0.08);
    display:flex; gap:10px; align-items:flex-start;
  `;

  const icon = document.createElement("div");
  icon.style.cssText = `font-size:18px; line-height:1.1; margin-top:1px;`;

  const text = document.createElement("div");
  text.style.cssText = `font-size:14px; line-height:1.3; white-space:pre-line;`;

  const map = {
    info: { i: "ℹ️", b: "rgba(0,0,0,.06)" },
    ok: { i: "✅", b: "rgba(34,197,94,.25)" },
    warn: { i: "⚠️", b: "rgba(245,158,11,.25)" },
    err: { i: "❌", b: "rgba(239,68,68,.25)" }
  };
  const m = map[type] || map.info;

  icon.textContent = m.i;
  el.style.borderColor = m.b;

  text.textContent = msg;

  el.appendChild(icon);
  el.appendChild(text);

  const wrap = document.getElementById("toastWrap");
  wrap.appendChild(el);

  setTimeout(() => {
    el.style.transition = "all .25s ease";
    el.style.opacity = "0";
    el.style.transform = "translateY(8px)";
    setTimeout(() => el.remove(), 260);
  }, ms);
}

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

/* ✅ กล่องเลือกโต๊ะ+ราคา */
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
  if (!found) return alert("ไม่พบโต๊ะนี้");

  found.classList.add("table-found");
  found.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
}

btnFindTable?.addEventListener("click", findTable);
btnClearFind?.addEventListener("click", () => {
  tableSearchEl.value = "";
  clearFoundMark();
});

// ✅ Submit = บันทึกทันที
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
    try { data = JSON.parse(text); }
    catch { throw new Error("API ไม่ได้ส่ง JSON: " + text); }

    if (!data.ok) {
      setStatus("❌ จองไม่สำเร็จ: " + (data.message || "unknown"), false);
      toast("จองไม่สำเร็จ ❌\n" + (data.message || "unknown"), "err", 6000);
      return;
    }

    setStatus("✅ จองสำเร็จแล้ว!", true);

    // ✅ แจ้งเตือนให้ผู้ใช้เห็นชัด
    toast(`บันทึกสำเร็จ 🎉\nแถว ${zone} โต๊ะ ${tableNo}`, "ok", 4200);

    bookingForm.reset();
    hideForm();

    const bookedSet = await loadBookedAll();
    updateCounts(bookedSet);
    renderButtons(bookedSet);

  } catch (err) {
    console.error(err);
    setStatus("❌ เกิดข้อผิดพลาด: " + (err.message || err), false);
    toast("เกิดข้อผิดพลาด ❌\n" + (err.message || err), "err", 6500);
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
