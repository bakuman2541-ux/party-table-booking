// ✅ URL /exec ของ Apps Script Web App (ต้องเป็น Deploy > Web app)
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

function renderResults(items) {
  if (!items || items.length === 0) {
    resultBox.innerHTML = `
      <div class="plan">
        <div style="font-weight:1000;">❌ ไม่พบข้อมูลการจอง</div>
        <div style="margin-top:6px;color:#64748b;font-weight:800;">
          ลองค้นหาด้วยเบอร์โทร หรือชื่อผู้จอง/นักเรียน
        </div>
      </div>
    `;
    return;
  }

  const html = items.map((x) => `
    <div class="plan" style="margin-bottom:14px;">
      <div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;">
        <div style="font-weight:1000;font-size:16px;">✅ พบการจอง</div>
        <div style="font-weight:1000;">
          🪑 แถว <b>${esc(x.zone)}</b> โต๊ะ <b>${esc(x.tableNo)}</b>
        </div>
      </div>

      <div style="margin-top:10px;color:#334155;font-weight:800;line-height:1.8;">
        👤 ผู้จอง: <b>${esc(x.bookerName)}</b><br/>
        🎓 นักเรียน: <b>${esc(x.studentName)}</b><br/>
        🏫 ชั้น: <b>${esc(x.classLevel)}</b> | 🧑‍🏫 ครู: <b>${esc(x.homeroomTeacher)}</b><br/>
        📞 เบอร์: <b>${esc(x.phone)}</b><br/>
        🕒 เวลา: <b>${esc(x.createdAt)}</b>
      </div>
    </div>
  `).join("");

  resultBox.innerHTML = html;
}

function showDebug(title, objOrText) {
  const content = typeof objOrText === "string"
    ? esc(objOrText)
    : esc(JSON.stringify(objOrText, null, 2));

  resultBox.innerHTML = `
    <div class="plan">
      <div style="font-weight:1000;">${esc(title)}</div>
      <pre style="margin-top:10px;white-space:pre-wrap;font-weight:800;color:#334155;">${content}</pre>
    </div>
  `;
}

async function doSearch() {
  const q = qEl.value.trim();
  if (!q) {
    statusEl.textContent = "❌ กรุณากรอกคำค้นหา";
    return;
  }

  statusEl.textContent = "⏳ กำลังค้นหา...";
  resultBox.innerHTML = "";

  try {
    const url = `${WEB_APP_URL}?action=checkBooking&q=${encodeURIComponent(q)}`;
    const res = await fetch(url, { method: "GET" });

    // ✅ อ่านเป็น text ก่อน (กัน JSON parse fail)
    const text = await res.text();

    if (!res.ok) {
      statusEl.textContent = `❌ ค้นหาไม่สำเร็จ (HTTP ${res.status})`;
      showDebug("รายละเอียดจากเซิร์ฟเวอร์", text);
      return;
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch (err) {
      statusEl.textContent = "❌ ระบบตอบกลับไม่ใช่ JSON";
      showDebug("ข้อความที่ได้รับ (ไม่ใช่ JSON)", text);
      return;
    }

    if (!data.ok) {
      statusEl.textContent = "❌ ค้นหาไม่สำเร็จ";
      showDebug("ข้อมูลตอบกลับจากระบบ", data);
      return;
    }

    statusEl.textContent = `✅ พบ ${data.items.length} รายการ`;
    renderResults(data.items);

  } catch (err) {
    console.error(err);
    statusEl.textContent = "❌ Error: ไม่สามารถเชื่อมต่อได้";
    showDebug("รายละเอียด Error", String(err));
  }
}

btnSearch.addEventListener("click", doSearch);

qEl.addEventListener("keydown", (e) => {
  if (e.key === "Enter") doSearch();
});
