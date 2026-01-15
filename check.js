const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbw354eehe0zKpQIvgTRsCLEVnvnT7_U5dNnwVjw4icxw9S9I6U8NEKzTUGRlPoaw18/exec";

const qEl = document.getElementById("q");
const statusEl = document.getElementById("status");
const resultBox = document.getElementById("resultBox");
const btnSearch = document.getElementById("btnSearch");

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (m) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[m]));
}

function digitsOnly(v) {
  return String(v ?? "").replace(/\D/g, "");
}

/* ✅ เบอร์โทร: เติม 0 + ใส่ - หลังตัวที่ 3 */
function formatPhone(phoneRaw) {
  let p = String(phoneRaw ?? "").trim();
  p = p.replace(/\D/g, "");

  if (p && !p.startsWith("0")) p = "0" + p;
  if (p.length > 10) p = p.slice(0, 10);

  if (p.length >= 4) return p.slice(0, 3) + "-" + p.slice(3);
  return p;
}

function prettyTime(v) {
  const s = String(v ?? "").trim();
  if (!s) return "-";

  if (s.includes("T")) {
    return s.replace("T", " ").replace(".000Z", "").replace("Z", "");
  }
  return s;
}

/* ✅ render เป็นการ์ด */
function renderResults(items, keyword) {
  const header = `
    <div class="check-card">
      <div class="check-title">
        <div>✅ ผลการค้นหา</div>
        <div class="check-badge">คำค้น: ${esc(keyword)}</div>
      </div>
      <div class="check-grid">
        <div class="check-item">พบ <b>${items.length}</b> รายการ</div>
      </div>
    </div>
  `;

  if (!items || items.length === 0) {
    resultBox.innerHTML = `
      ${header}
      <div class="check-card">
        <div class="check-title">
          <div>❌ ไม่พบข้อมูล</div>
          <div class="check-badge">ลองใหม่</div>
        </div>
        <div class="check-grid">
          <div class="check-item">• ลองค้นหาด้วย “เบอร์โทร” หรือ “ชื่อผู้จอง/นักเรียน”</div>
        </div>
      </div>
    `;
    return;
  }

  const cards = items.map((x) => {
    const zone = esc(x.zone || "-");
    const tableNo = esc(x.tableNo || "-");
    const bookerName = esc(x.bookerName || "-");
    const studentName = esc(x.studentName || "-");
    const classLevel = esc(x.classLevel || "-");
    const homeroomTeacher = esc(x.homeroomTeacher || "-");
    const phone = esc(formatPhone(x.phone || ""));
    const createdAt = esc(prettyTime(x.createdAt));

    return `
      <div class="check-card">
        <div class="check-title">
          <div>✅ พบการจอง</div>
          <div class="check-badge">🪑 แถว ${zone} โต๊ะ ${tableNo}</div>
        </div>

        <div class="check-grid">
          <div class="check-item">👤 ผู้จอง: <b>${bookerName}</b></div>
          <div class="check-item">🎓 นักเรียน: <b>${studentName}</b></div>
          <div class="check-item">🏫 ชั้น: <b>${classLevel}</b></div>
          <div class="check-item">🧑‍🏫 ครู: <b>${homeroomTeacher}</b></div>
          <div class="check-item">📞 เบอร์: <b>${phone || "-"}</b></div>
          <div class="check-item">🕒 เวลา: <b>${createdAt}</b></div>
        </div>
      </div>
    `;
  }).join("");

  resultBox.innerHTML = header + cards;
}

/* ✅ ยิง request ไปหา GAS */
async function fetchCheck(q) {
  const url = `${WEB_APP_URL}?action=checkBooking&q=${encodeURIComponent(q)}`;
  const res = await fetch(url);
  const text = await res.text();

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    return { ok: false, error: "JSON parse error", raw: text };
  }
  return data;
}

/* ✅ ลองค้นหาหลายรูปแบบ (แก้ปัญหาเบอร์มี/ไม่มี -) */
function buildSearchCandidates(rawQ) {
  const raw = String(rawQ ?? "").trim();
  const d = digitsOnly(raw);

  const list = [];

  // 1) แบบที่พิมพ์มาเลย
  if (raw) list.push(raw);

  // 2) แบบเลขล้วน
  if (d) list.push(d);

  // 3) แบบ format 0xx-xxxxxxx
  const dashed = formatPhone(d);
  if (dashed) list.push(dashed);

  // 4) ถ้าเป็นเลข 9 ตัว (ไม่มี 0) ให้ลองเติม 0
  if (d.length === 9 && !d.startsWith("0")) {
    const d0 = "0" + d;
    list.push(d0);
    list.push(formatPhone(d0));
  }

  // กันซ้ำ
  return [...new Set(list.filter(Boolean))];
}

async function doSearch() {
  const rawQ = qEl.value.trim();
  if (!rawQ) {
    statusEl.textContent = "❌ กรุณากรอกคำค้นหา";
    resultBox.innerHTML = "";
    return;
  }

  statusEl.textContent = "⏳ กำลังค้นหา...";
  resultBox.innerHTML = "";

  try {
    const candidates = buildSearchCandidates(rawQ);

    // ✅ ลองทีละแบบจนกว่าจะเจอ
    let finalData = null;

    for (const q of candidates) {
      const data = await fetchCheck(q);

      if (data && data.ok && Array.isArray(data.items) && data.items.length > 0) {
        finalData = data;
        break;
      }

      // ถ้า backend ตอบ ok แต่ 0 รายการ -> ลองตัวถัดไป
      if (data && data.ok) continue;

      // ถ้าไม่ ok -> ลองต่อ
      continue;
    }

    if (!finalData) {
      // ถ้าไม่พบเลย → ใช้ผล 0
      statusEl.textContent = "✅ ค้นหาสำเร็จ";
      renderResults([], rawQ);
      return;
    }

    statusEl.textContent = "✅ ค้นหาสำเร็จ";
    renderResults(finalData.items || [], rawQ);

  } catch (err) {
    console.error(err);
    statusEl.textContent = "❌ Error: ไม่สามารถเชื่อมต่อได้";
    resultBox.innerHTML = `<div class="check-card"><pre style="white-space:pre-wrap">${esc(String(err))}</pre></div>`;
  }
}

btnSearch.addEventListener("click", doSearch);
qEl.addEventListener("keydown", (e) => {
  if (e.key === "Enter") doSearch();
});
