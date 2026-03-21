/* ==========================================================================
   📂 FILE: Sow_Service.gs  [ชุดที่ 4/4]
   คำอธิบาย: ระบบจัดการแม่พันธุ์
   Refactored: ลบ SOW_CONFIG ออก → ใช้ SHEET.*, PROPS_KEYS, UTILS_* แทน
   รักษาชื่อฟังก์ชันเดิมทุกตัว และ THAI_ENGLISH_MAP คงเดิม 100%
   ========================================================================== */

// ==========================================
// 🗺️ THAI_ENGLISH_MAP (คงเดิม — ใช้เฉพาะระบบแม่พันธุ์)
// แปลชื่อหัวตารางภาษาไทย → English key
// ==========================================
const THAI_ENGLISH_MAP = {
  "แม่_ทะเบียนประวัติ": {
    "รหัสแม่สุกร": "sowId", "เบอร์หู": "earTag", "ชื่อแม่พันธุ์": "sowName",
    "วันเกิด": "birthDate", "สายพันธุ์": "breed", "แหล่งที่มา": "source",
    "ครอกที่": "parity", "สถานะ(ป้อนเอง)": "statusManual", "สถานะ(ระบบ)": "statusComputed",
    "กิจกรรมถัดไป": "nextAction", "วันที่นัดหมาย": "nextActionDate",
    "อัปเดตล่าสุด": "lastUpdatedAt", "รหัสปฏิทิน": "calendarEventId", "URLรูปภาพ": "imageUrl"
  },
  "แม่_บันทึกผสม": {
    "รหัสเหตุการณ์": "logId", "รหัสแม่สุกร": "sowId", "เบอร์หู": "earTag",
    "ประเภทเหตุการณ์": "eventType", "วันที่เกิดเหตุ": "eventDate", "รายละเอียด": "details",
    "รหัสพ่อพันธุ์": "sireId", "ครอกที่": "parity", "ผู้บันทึก": "createdBy",
    "วันที่บันทึก": "createdAt", "เหตุผล": "reason"
  },
  "แม่_ทะเบียนพ่อพันธุ์": {
    "รหัสพ่อพันธุ์": "sireId", "ชื่อพ่อพันธุ์": "sireName", "ประเภท": "sireType",
    "สายพันธุ์": "breed", "สถานะ": "status", "หมายเหตุ": "notes"
  },
  "แม่_การใช้ยา": {
    "รหัสบันทึกยา": "medLogId", "รหัสแม่สุกร": "sowId", "เบอร์หู": "earTag",
    "วันที่": "eventDate", "ชื่อยา/วัคซีน": "medicationName", "ปริมาณ": "dosage",
    "เหตุผล": "reason", "ผู้บันทึก": "createdBy", "วันที่บันทึก": "createdAt"
  },
  "แม่_บันทึกคลอด": {
    "รหัสบันทึก": "farrowId", "รหัสแม่สุกร": "sowId", "เบอร์หู": "earTag",
    "ครอกที่": "parity", "วันที่คลอด": "farrowDate", "เกิดมีชีวิต": "bornAlive",
    "ตาย": "stillborn", "มัมมี่": "mummified", "รวมเกิด": "totalBorn",
    "นน.รวม": "totalBirthWeight", "นน.แรกเกิดเฉลี่ย (กก.)": "avgBirthWeight",
    "ผู้บันทึก": "createdBy", "วันที่บันทึก": "createdAt"
  },
  "แม่_บันทึกหย่านม": {
    "รหัสบันทึก": "weanId", "รหัสการคลอด": "farrowId", "รหัสแม่สุกร": "sowId",
    "เบอร์หู": "earTag", "ครอกที่": "parity", "วันที่หย่านม": "weanDate",
    "จำนวนลูก": "pigsWeaned", "นน.รวม": "totalWeanWeight",
    "น้ำหนักหย่านมเฉลี่ย (กก.)": "avgWeanWeight", "อายุหย่านม (วัน)": "weanAge",
    "ผู้บันทึก": "createdBy", "วันที่บันทึก": "createdAt"
  },
  "แม่_โปรแกรมวัคซีน": {
    "Code": "code", "ชื่อวัคซีน": "vaccineName", "ระยะ": "stage",
    "วันอ้างอิง": "refEvent", "จำนวนวัน(Days)": "daysOffset", "คำแนะนำ": "advice"
  }
};

// แผนที่ English Key → ชื่อชีตไทย (แทน SOW_CONFIG.SHEET_NAMES)
const SOW_SHEET_MAP = {
  SowRegister:   SHEET.SOW_REGISTER,
  BreedingLog:   SHEET.SOW_BREEDING,
  FarrowingLog:  SHEET.SOW_FARROWING,
  WeaningLog:    SHEET.SOW_WEANING,
  SireRegister:  SHEET.SOW_SIRE,
  MedicationLog: SHEET.SOW_MED,
  VaccineProgram:SHEET.SOW_VACCINE,
  Config:        SHEET.SOW_CONFIG,
  Notifications: SHEET.SOW_NOTIFY,
  Dashboard:     SHEET.SOW_DASHBOARD,
  AI_Knowledge:  SHEET.SOW_AI_KNOWLEDGE
};

// ==========================================
// 🛠️ HELPERS (ใช้เฉพาะระบบแม่พันธุ์)
// ==========================================

/**
 * ดึง Sheet ของระบบแม่พันธุ์ด้วย English Key
 * (wrapper บาง ๆ ของ UTILS_getSheet เพื่อแปลง key → ชื่อไทย)
 */
function sow_getSheet(sheetKey) {
  return UTILS_getSheet(SOW_SHEET_MAP[sheetKey] || sheetKey);
}

/**
 * Header Map สำหรับชีตแม่พันธุ์ (Thai column → English key → column index)
 * ใช้ THAI_ENGLISH_MAP เป็นตัวแปลชื่อหัวตารางภาษาไทย → English key แล้ว cache ไว้
 *
 * ⚠️ แตกต่างจาก _HEADER_CACHE ใน 0_Utils.gs โดยตั้งใจ:
 *   _HEADER_CACHE     (0_Utils.gs)    → map "ชื่อหัวตาราง" → index ตรงๆ (ใช้ Fatten/Feed)
 *   _SOW_HEADER_CACHE (Sow_Service.gs) → map "English key"  → index (ผ่าน THAI_ENGLISH_MAP)
 * ต้องแยก cache เพราะ key format ต่างกัน — ถ้าใช้ cache เดียวกันจะทับข้อมูลกัน
 */
var _SOW_HEADER_CACHE = {};
function sow_getHeaderMap(sheet) {
  if (!sheet) return {};
  const sheetName = sheet.getName();
  if (_SOW_HEADER_CACHE[sheetName]) return _SOW_HEADER_CACHE[sheetName];

  // กรณีพิเศษ: Dashboard ใช้ index ตรง
  if (sheetName === SHEET.SOW_DASHBOARD) {
    return { metric_key: 1, metric_value: 2, updated_at: 3 };
  }

  const map = THAI_ENGLISH_MAP[sheetName];
  if (!map) return {};

  const rawHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const finalMap   = {};
  for (const thaiKey in map) {
    const idx = rawHeaders.indexOf(thaiKey);
    if (idx > -1) finalMap[map[thaiKey]] = idx + 1;
  }
  _SOW_HEADER_CACHE[sheetName] = finalMap;
  return finalMap;
}

function sow_findSowRow(id) {
  const s = sow_getSheet("SowRegister");
  const h = sow_getHeaderMap(s);
  const d = s.getRange(2, h.sowId, s.getLastRow(), 1).getValues();
  for (let i = 0; i < d.length; i++) if (d[i][0] == id) return i + 2;
  return -1;
}

function sow_addDays(d, n) { const r = new Date(d); r.setDate(r.getDate() + Number(n)); return r; }
function sow_daysBetween(a, b) { return Math.round((new Date(b) - new Date(a)) / 86400000); }

function sow_getAllLogsGroupedBySow() {
  const s = sow_getSheet("BreedingLog");
  const h = sow_getHeaderMap(s);
  const d = s.getDataRange().getValues();
  const g = {};
  d.slice(1).forEach(r => {
    const id = r[h.sowId - 1];
    if (!g[id]) g[id] = [];
    g[id].push({ eventType: r[h.eventType - 1], eventDate: r[h.eventDate - 1] });
  });
  return g;
}

function sow_getLogsForSow(sowId) {
  const logSheet = sow_getSheet("BreedingLog");
  if (!logSheet || logSheet.getLastRow() < 2) return [];
  const h = sow_getHeaderMap(logSheet);
  if (!h.sowId || !h.eventType || !h.eventDate) return [];
  const data = logSheet.getRange(2, 1, logSheet.getLastRow() - 1, logSheet.getLastColumn()).getValues();
  const logs = data
    .filter(row => row[h.sowId - 1] === sowId)
    .map(row => ({
      sowId:     row[h.sowId - 1],
      eventType: row[h.eventType - 1],
      eventDate: row[h.eventDate - 1],
      ...(h.logId   && { logId:   row[h.logId - 1]   }),
      ...(h.details && { details: row[h.details - 1] })
    }));
  return logs.sort((a, b) => new Date(b.eventDate) - new Date(a.eventDate));
}

function sow_uploadImageAndGetUrl(id, f) {
  return UTILS_uploadFileToDrive(
    PropertiesService.getScriptProperties().getProperty(PROPS_KEYS.SOW_IMAGE_FOLDER_ID),
    { base64: f.data, mimeType: f.mimeType, name: id }
  );
}

function sow_syncCalendarEvent(earTag, title, date, eventId) {
  const calId = PropertiesService.getScriptProperties().getProperty(PROPS_KEYS.SOW_CALENDAR_ID);
  if (!calId || !date) return "";
  const dStr    = Utilities.formatDate(date, Session.getScriptTimeZone(), "yyyy-MM-dd");
  const details = { summary: `[${earTag}] ${title}`, start: { date: dStr }, end: { date: dStr } };
  try {
    if (eventId) { try { Calendar.Events.update(details, calId, eventId); return eventId; } catch (e) {} }
    return Calendar.Events.insert(details, calId).id;
  } catch (e) { return ""; }
}

function sow_getFarrowingLogData(farrowId) {
  const sheet = sow_getSheet("FarrowingLog");
  if (!sheet || sheet.getLastRow() < 2) return null;
  const h    = sow_getHeaderMap(sheet);
  const data = sheet.getDataRange().getValues().slice(1);
  const row  = data.find(r => String(r[h.farrowId - 1]) === String(farrowId));
  if (!row) return null;
  return {
    farrowId:  row[h.farrowId - 1],
    sowId:     row[h.sowId - 1],
    earTag:    row[h.earTag - 1],
    parity:    row[h.parity - 1],
    farrowDate:row[h.farrowDate - 1]
  };
}

function sow_updateSowParity(sowId, parity) {
  const sheet = sow_getSheet("SowRegister");
  const row   = sow_findSowRow(sowId);
  if (row > -1) {
    const h = sow_getHeaderMap(sheet);
    sheet.getRange(row, h.parity).setValue(parity);
  }
}

function getAppUrl() { return ScriptApp.getService().getUrl(); }


/* =========================================
   🔧 1. INIT
   ========================================= */

function sow_initializeSpreadsheet() {
  // ตรวจสอบชีตที่จำเป็น (ใช้ SHEET.* แล้ว)
  for (const key in SOW_SHEET_MAP) {
    // สามารถเพิ่ม logic สร้างชีตอัตโนมัติได้ที่นี่
  }
}


/* =========================================
   ✏️ 2. WRITE FUNCTIONS (Web App API)
   ========================================= */

function sow_addSowRegister(sowData, fileData) {
  try {
    const newEarTagRaw = sowData["earTag"];
    if (!newEarTagRaw || typeof newEarTagRaw !== 'string' || newEarTagRaw.trim() === "") {
      return "❌ เกิดข้อผิดพลาด: กรุณากรอก 'เบอร์หู'";
    }
    const newEarTag = newEarTagRaw.trim();
    const sheet     = sow_getSheet("SowRegister");
    if (!sheet) return "❌ เกิดข้อผิดพลาด: ไม่พบชีต 'แม่_ทะเบียนประวัติ'!";

    const headers      = sow_getHeaderMap(sheet);
    const earTagColumn = headers.earTag;

    if (sheet.getLastRow() > 1) {
      const allEarTags = sheet.getRange(2, earTagColumn, sheet.getLastRow() - 1, 1).getValues();
      for (let i = 0; i < allEarTags.length; i++) {
        if ((allEarTags[i][0] || "").toString().trim().toLowerCase() === newEarTag.toLowerCase()) {
          return `❌ เกิดข้อผิดพลาด: เบอร์หู "${newEarTag}" นี้มีอยู่แล้ว!`;
        }
      }
    }

    const newRow   = new Array(Object.keys(headers).length).fill('');
    const newSowId = `SOW-${Utilities.getUuid().substring(0, 4)}`;
    newRow[headers.sowId - 1]        = newSowId;
    newRow[headers.earTag - 1]       = newEarTag;
    newRow[headers.sowName - 1]      = sowData["sowName"]  || "";
    newRow[headers.birthDate - 1]    = sowData["birthDate"]|| "";
    newRow[headers.breed - 1]        = sowData["breed"]    || "";
    newRow[headers.source - 1]       = sowData["source"]   || "";
    newRow[headers.parity - 1]       = 0;
    newRow[headers.statusManual - 1] = "พร้อมใช้งาน";
    newRow[headers.statusComputed - 1]= "พร้อมผสม";
    newRow[headers.nextAction - 1]   = "พร้อมผสม";
    newRow[headers.lastUpdatedAt - 1]= new Date();

    if (fileData && fileData.data && headers.imageUrl) {
      const imageUrl = sow_uploadImageAndGetUrl(newSowId, fileData);
      if (imageUrl) newRow[headers.imageUrl - 1] = imageUrl;
    }

    sheet.appendRow(newRow);
    SpreadsheetApp.flush();
    return `✅ บันทึกแม่สุกร "${newEarTag}" เรียบร้อยแล้ว!`;
  } catch (e) {
    return `❌ เกิดข้อผิดพลาดร้ายแรงขณะบันทึก: ${e.message}`;
  }
}

function sow_addBreedingEvent(eventData) {
  try {
    const sheet   = sow_getSheet("BreedingLog");
    const headers = sow_getHeaderMap(sheet);
    const newRow  = new Array(Object.keys(headers).length).fill('');
    newRow[headers.logId - 1]     = `LOG-${Utilities.getUuid().substring(0, 6)}`;
    newRow[headers.sowId - 1]     = eventData["sowId"];
    newRow[headers.earTag - 1]    = eventData["earTag"]     || "";
    newRow[headers.eventType - 1] = eventData["eventType"];
    newRow[headers.eventDate - 1] = new Date(eventData["eventDate"]);
    newRow[headers.details - 1]   = eventData["details"]    || "";
    newRow[headers.sireId - 1]    = eventData["sireId"]     || "";
    newRow[headers.parity - 1]    = eventData["parity"]     || "";
    newRow[headers.createdBy - 1] = Session.getActiveUser().getEmail();
    newRow[headers.createdAt - 1] = new Date();
    newRow[headers.reason - 1]    = eventData["reason"]     || "";
    sheet.appendRow(newRow);
    SpreadsheetApp.flush();
    const sowRow = sow_findSowRow(eventData["sowId"]);
    if (sowRow > -1) sow_runCalculationForSingleSow(sowRow);
    return "✅ บันทึกเหตุการณ์เรียบร้อยแล้ว";
  } catch (e) {
    return `❌ เกิดข้อผิดพลาด: ${e.message}`;
  }
}

function sow_addMedicationLog(medData) {
  try {
    const sheet = sow_getSheet("MedicationLog");
    if (!sheet) return "❌ เกิดข้อผิดพลาด: ไม่พบชีต 'MedicationLog'!";
    const headers = sow_getHeaderMap(sheet);
    const newRow  = new Array(Object.keys(headers).length).fill('');
    newRow[headers.medLogId - 1]       = `MED-${Utilities.getUuid().substring(0, 6)}`;
    newRow[headers.sowId - 1]          = medData["sowId"];
    newRow[headers.earTag - 1]         = medData["earTag"]          || "";
    newRow[headers.eventDate - 1]      = new Date(medData["eventDate"]);
    newRow[headers.medicationName - 1] = medData["medicationName"];
    newRow[headers.dosage - 1]         = medData["dosage"]           || "";
    newRow[headers.reason - 1]         = medData["reason"]           || "";
    newRow[headers.createdBy - 1]      = Session.getActiveUser().getEmail();
    newRow[headers.createdAt - 1]      = new Date();
    sheet.appendRow(newRow);
    SpreadsheetApp.flush();
    return "✅ บันทึกการใช้ยา/วัคซีนเรียบร้อยแล้ว";
  } catch (e) { return "❌ เกิดข้อผิดพลาด: " + e.message; }
}

function sow_addFarrowingRecord(data) {
  try {
    const farrowSheet = sow_getSheet("FarrowingLog");
    const headers     = sow_getHeaderMap(farrowSheet);
    const user        = Session.getActiveUser().getEmail();
    const sowId       = data["sowId"];
    const earTag      = data["earTag"];
    const parity      = Number(data["parity"]);
    const farrowDate  = new Date(data["farrowDate"]);
    const bornAlive   = Number(data["bornAlive"])       || 0;
    const stillborn   = Number(data["stillborn"])       || 0;
    const mummified   = Number(data["mummified"])       || 0;
    const totalBirthWeight = Number(data["totalBirthWeight"]) || 0;
    const totalBorn   = bornAlive + stillborn + mummified;
    const avgBirthWeight = bornAlive > 0 ? (totalBirthWeight / bornAlive) : 0;

    const newRow = new Array(Object.keys(headers).length).fill('');
    const newFarrowId = `FAR-${Utilities.getUuid().substring(0, 6)}`;
    newRow[headers.farrowId - 1]        = newFarrowId;
    newRow[headers.sowId - 1]           = sowId;
    newRow[headers.earTag - 1]          = earTag;
    newRow[headers.parity - 1]          = parity;
    newRow[headers.farrowDate - 1]      = farrowDate;
    newRow[headers.bornAlive - 1]       = bornAlive;
    newRow[headers.stillborn - 1]       = stillborn;
    newRow[headers.mummified - 1]       = mummified;
    newRow[headers.totalBorn - 1]       = totalBorn;
    newRow[headers.totalBirthWeight - 1]= totalBirthWeight;
    newRow[headers.avgBirthWeight - 1]  = avgBirthWeight;
    newRow[headers.createdBy - 1]       = user;
    newRow[headers.createdAt - 1]       = new Date();
    farrowSheet.appendRow(newRow);
    sow_updateSowParity(sowId, parity);
    sow_addBreedingEvent({
      sowId, earTag, eventType: "คลอด", eventDate: farrowDate, parity,
      details: `คลอด (มีชีวิต ${bornAlive}, ตาย ${stillborn}, มัมมี่ ${mummified})`
    });
    return `✅ บันทึกการคลอด (ครอกที่ ${parity}) ของ ${earTag} เรียบร้อย!`;
  } catch (e) {
    return `❌ เกิดข้อผิดพลาดร้ายแรงขณะบันทึกการคลอด: ${e.message}`;
  }
}

function sow_addWeaningRecord(data) {
  try {
    const weanSheet      = sow_getSheet("WeaningLog");
    const headers        = sow_getHeaderMap(weanSheet);
    const user           = Session.getActiveUser().getEmail();
    const farrowId       = data["farrowId"];
    const weanDate       = new Date(data["weanDate"]);
    const pigsWeaned     = Number(data["pigsWeaned"])     || 0;
    const totalWeanWeight= Number(data["totalWeanWeight"])|| 0;
    const farrowData     = sow_getFarrowingLogData(farrowId);
    if (!farrowData) return `❌ เกิดข้อผิดพลาด: ไม่พบข้อมูลครอก (FarrowID: ${farrowId})!`;

    const avgWeanWeight = pigsWeaned > 0 ? (totalWeanWeight / pigsWeaned) : 0;
    const weanAge       = sow_daysBetween(farrowData.farrowDate, weanDate);
    const newRow        = new Array(Object.keys(headers).length).fill('');
    newRow[headers.weanId - 1]          = `WEAN-${Utilities.getUuid().substring(0, 6)}`;
    newRow[headers.farrowId - 1]        = farrowId;
    newRow[headers.sowId - 1]           = farrowData.sowId;
    newRow[headers.earTag - 1]          = farrowData.earTag;
    newRow[headers.parity - 1]          = farrowData.parity;
    newRow[headers.weanDate - 1]        = weanDate;
    newRow[headers.pigsWeaned - 1]      = pigsWeaned;
    newRow[headers.totalWeanWeight - 1] = totalWeanWeight;
    newRow[headers.avgWeanWeight - 1]   = avgWeanWeight;
    newRow[headers.weanAge - 1]         = weanAge;
    newRow[headers.createdBy - 1]       = user;
    newRow[headers.createdAt - 1]       = new Date();
    weanSheet.appendRow(newRow);
    sow_addBreedingEvent({
      sowId: farrowData.sowId, earTag: farrowData.earTag, eventType: "หย่านม",
      eventDate: weanDate, parity: farrowData.parity,
      details: `หย่านม (จำนวน ${pigsWeaned} ตัว)`
    });
    return `✅ บันทึกการหย่านม (ครอกที่ ${farrowData.parity}) ของ ${farrowData.earTag} เรียบร้อย!`;
  } catch (e) {
    return `❌ เกิดข้อผิดพลาดร้ายแรงขณะบันทึกการหย่านม: ${e.message}`;
  }
}

function sow_addSireRegister(sireData) {
  try {
    const sheet = sow_getSheet("SireRegister");
    const headers = sow_getHeaderMap(sheet);
    const newRow  = new Array(Object.keys(headers).length).fill('');
    newRow[headers.sireId - 1]   = sireData["sireId"];
    newRow[headers.sireName - 1] = sireData["sireName"];
    newRow[headers.sireType - 1] = sireData["sireType"];
    newRow[headers.breed - 1]    = sireData["breed"]  || "";
    newRow[headers.status - 1]   = sireData["status"] || "ใช้งาน";
    newRow[headers.notes - 1]    = sireData["notes"]  || "";
    sheet.appendRow(newRow);
    SpreadsheetApp.flush();
    return "✅ บันทึกข้อมูลพ่อพันธุ์/น้ำเชื้อ เรียบร้อยแล้ว";
  } catch (e) {
    return `❌ เกิดข้อผิดพลาด: ${e.message}`;
  }
}


/* =========================================
   📤 3. READ FUNCTIONS
   ========================================= */

function sow_getDashboardData() {
  const sheet = sow_getSheet("SowRegister");
  if (!sheet || sheet.getLastRow() < 2) return null;

  const headers = sow_getHeaderMap(sheet);
  const data    = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();
  let stats = { total_sows: 0, status_wait: 0, status_preg: 0, status_lac: 0, status_rest: 0, status_alert: 0 };

  data.forEach(row => {
    const status = (row[headers.statusComputed - 1] || row[headers.statusManual - 1] || "").toString().trim();
    stats.total_sows++;
    switch (status) {
      case "พร้อมใช้งาน": case "พร้อมผสม": case "ผสมพันธุ์":
      case "รอตรวจท้อง (21วัน)": case "ตรวจท้อง (ไม่พบ)": case "ผสมใหม่": case "กลับสัด":
        stats.status_wait++;   break;
      case "ตรวจท้อง (พบ)": case "อุ้มท้อง": case "ใกล้คลอด": case "รอคลอด":
        stats.status_preg++;   break;
      case "คลอด": case "เลี้ยงลูก":
        stats.status_lac++;    break;
      case "หย่านม": case "พักฟื้น": case "รอผสม":
        stats.status_rest++;   break;
      default:
        stats.status_alert++;
    }
  });
  return stats;
}

function sow_getSowRegister() {
  const sheet = sow_getSheet("SowRegister");
  Utilities.sleep(100);
  if (!sheet || sheet.getLastRow() < 2) return [];
  const headers = sow_getHeaderMap(sheet);
  const data    = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();
  return data.map(row => {
    const obj = {};
    Object.keys(headers).forEach(key => {
      const colNum = headers[key];
      if (colNum) {
        const value = row[colNum - 1];
        obj[key] = (value instanceof Date)
          ? Utilities.formatDate(value, Session.getScriptTimeZone(), "yyyy-MM-dd")
          : value;
      } else { obj[key] = null; }
    });
    return obj;
  });
}

function sow_getSireList() {
  const sheet = sow_getSheet("SireRegister");
  if (!sheet || sheet.getLastRow() < 2) return [];
  const headers = sow_getHeaderMap(sheet);
  const data    = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();
  return data.map(row => ({ id: row[headers.sireId - 1], name: row[headers.sireName - 1], type: row[headers.sireType - 1] }));
}

function sow_getSowList() {
  const sheet = sow_getSheet("SowRegister");
  if (!sheet || sheet.getLastRow() < 2) return [];
  const headers = sow_getHeaderMap(sheet);
  const data    = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();
  return data.map(row => ({ id: row[headers.sowId - 1], earTag: row[headers.earTag - 1], parity: row[headers.parity - 1] || 0 }));
}

function sow_getBreedingHistory(sowId) {
  if (!sowId) return [];
  const logs = sow_getLogsForSow(sowId);
  if (!logs || logs.length === 0) return [];
  const tz = Session.getScriptTimeZone();
  return logs.map(log => ({
    eventDate: Utilities.formatDate(log.eventDate, tz, "yyyy-MM-dd"),
    eventType: log.eventType || 'N/A',
    details:   log.details   || '-'
  }));
}

function sow_getLittersForWeaning() {
  const farrowSheet = sow_getSheet("FarrowingLog");
  const weanSheet   = sow_getSheet("WeaningLog");
  if (!farrowSheet || farrowSheet.getLastRow() < 2) return [];

  const farrowHeaders = sow_getHeaderMap(farrowSheet);
  const farrowData    = farrowSheet.getRange(2, 1, farrowSheet.getLastRow() - 1, farrowSheet.getLastColumn()).getValues();

  const weanedFarrowIds = new Set();
  if (weanSheet && weanSheet.getLastRow() > 1) {
    const weanHeaders = sow_getHeaderMap(weanSheet);
    if (weanHeaders.farrowId) {
      weanSheet.getRange(2, weanHeaders.farrowId, weanSheet.getLastRow() - 1, 1)
        .getValues().forEach(row => { if (row[0]) weanedFarrowIds.add(row[0].toString()); });
    }
  }

  const litters = [];
  for (const row of farrowData) {
    const farrowId = (row[farrowHeaders.farrowId - 1] || "").toString();
    if (farrowId && !weanedFarrowIds.has(farrowId)) {
      litters.push({
        farrowId,
        sowId:     row[farrowHeaders.sowId - 1],
        earTag:    row[farrowHeaders.earTag - 1],
        parity:    row[farrowHeaders.parity - 1],
        farrowDate:Utilities.formatDate(row[farrowHeaders.farrowDate - 1], Session.getScriptTimeZone(), "yyyy-MM-dd")
      });
    }
  }
  return litters.sort((a, b) => new Date(b.farrowDate) - new Date(a.farrowDate));
}

function sow_getSowCardData(sowId) {
  try {
    const ss      = UTILS_getSpreadsheet();
    const regSheet= ss.getSheetByName(SHEET.SOW_REGISTER);
    if (!regSheet) { Logger.log("❌ ไม่พบชีต SOW_REGISTER"); return null; }

    const data    = regSheet.getDataRange().getValues();
    const headers = data[0];
    const getIdx  = name => headers.indexOf(name);
    const idx = {
      id:      getIdx("รหัสแม่สุกร"),
      tag:     getIdx("เบอร์หู"),
      breed:   getIdx("สายพันธุ์"),
      status:  getIdx("สถานะ(ระบบ)"),
      status2: getIdx("สถานะ(ป้อนเอง)"),
      parity:  getIdx("ครอกที่"),
      img:     getIdx("URLรูปภาพ"),
      nextDate:getIdx("วันที่นัดหมาย"),
      nextAction:getIdx("กิจกรรมถัดไป")
    };
    if (idx.id === -1) { Logger.log("❌ ไม่พบคอลัมน์ 'รหัสแม่สุกร'"); return null; }

    const row    = data.find(r => String(r[idx.id]).trim() === String(sowId).trim());
    if (!row)    { Logger.log("⚠️ ไม่พบแม่หมู ID: " + sowId); return null; }

    const status = row[idx.status] || row[idx.status2] || "ปกติ";
    const profile = {
      sowId, earTag: row[idx.tag], breed: row[idx.breed] || "-", status,
      parity: row[idx.parity] || 0, imageUrl: row[idx.img] || "",
      lastUpdate: UTILS_formatDate(new Date(), "d MMM yy")
    };

    profile.daysCount = "-"; profile.daysLabel = "";
    const nextDateRaw = row[idx.nextDate];
    if (nextDateRaw instanceof Date) {
      const today  = new Date(); today.setHours(0,0,0,0);
      const target = new Date(nextDateRaw); target.setHours(0,0,0,0);
      const diff   = Math.ceil((target - today) / 86400000);
      if (status.includes("อุ้มท้อง"))       { profile.daysLabel = "อีกกี่วันคลอด";   profile.daysCount = diff + " วัน"; }
      else if (status.includes("เลี้ยงลูก")) { profile.daysLabel = "อีกกี่วันหย่านม"; profile.daysCount = diff + " วัน"; }
      else { profile.daysLabel = "นัดหมายถัดไป"; profile.daysCount = diff > 0 ? `อีก ${diff} วัน` : (diff === 0 ? "วันนี้" : `เลยมา ${Math.abs(diff)} วัน`); }
    }

    // ดึงประวัติ 5 อันล่าสุด
    let logs = [];
    const logSheet = ss.getSheetByName(SHEET.SOW_BREEDING);
    if (logSheet) {
      const lData    = logSheet.getDataRange().getValues();
      const lHeaders = lData[0];
      const lIdx     = { id: lHeaders.indexOf("รหัสแม่สุกร"), event: lHeaders.indexOf("ประเภทเหตุการณ์"), date: lHeaders.indexOf("วันที่เกิดเหตุ"), detail: lHeaders.indexOf("รายละเอียด") };
      if (lIdx.id > -1) {
        logs = lData.filter(r => String(r[lIdx.id]) === String(sowId))
          .sort((a, b) => new Date(b[lIdx.date]) - new Date(a[lIdx.date]))
          .slice(0, 5)
          .map(r => ({
            event:  r[lIdx.event],
            date:   r[lIdx.date] instanceof Date ? UTILS_formatDate(r[lIdx.date], "d MMM yy") : "-",
            detail: r[lIdx.detail] || "-"
          }));
      }
    }

    // สถิติลูกดก
    let stats = { avgBornAlive: "-", totalLitters: 0 };
    const fSheet = ss.getSheetByName(SHEET.SOW_FARROWING);
    if (fSheet) {
      const fData    = fSheet.getDataRange().getValues();
      const fHeaders = fData[0];
      const fIdx     = { id: fHeaders.indexOf("รหัสแม่สุกร"), alive: fHeaders.indexOf("มีชีวิต") };
      if (fIdx.id > -1) {
        const myFarrows    = fData.filter(r => String(r[fIdx.id]) === String(sowId));
        stats.totalLitters = myFarrows.length;
        if (stats.totalLitters > 0) {
          const sumAlive = myFarrows.reduce((acc, r) => acc + Number(r[fIdx.alive] || 0), 0);
          stats.avgBornAlive = (sumAlive / stats.totalLitters).toFixed(1);
        }
      }
    }

    return {
      profile,
      status: { action: row[idx.nextAction] || "-", date: profile.daysLabel, count: profile.daysCount },
      stats,
      history: logs
    };
  } catch (e) {
    Logger.log("❌ Critical Error in sow_getSowCardData: " + e.message);
    return null;
  }
}

function sow_logNotificationToSheet(sowId, message, type) {
  try {
    const sheet = sow_getSheet("Notifications");
    if (!sheet) return;
    sheet.appendRow([`NOTI-${Utilities.getUuid().substring(0, 6)}`, new Date(), sowId, message, type, "TRUE", "FALSE"]);
  } catch (e) { Logger.log("Error logging notification: " + e.message); }
}


/* =========================================
   🤖 4. AI (อ๊อดแอด) & BATCH JOB
   ========================================= */

function sow_getFarmContextForAI() {
  let contextText = "";
  const dashData  = sow_getDashboardData();
  if (dashData) {
    contextText += "--- ข้อมูลสถิติฟาร์มปัจจุบัน ---\n";
    contextText += `- แม่พันธุ์ทั้งหมด: ${dashData.total_sows || 0} ตัว\n`;
    contextText += `- สถานะรอผสม: ${dashData.status_wait || 0} ตัว\n`;
    contextText += `- สถานะอุ้มท้อง: ${dashData.status_preg || 0} ตัว\n`;
    contextText += `- สถานะเลี้ยงลูก: ${dashData.status_lac || 0} ตัว\n\n`;
  }
  const vaccines = sow_getVaccineRules();
  if (vaccines.length > 0) {
    contextText += "--- โปรแกรมวัคซีน ---\n";
    vaccines.forEach(v => { contextText += `- ${v.name}: ฉีดเมื่อ ${v.refEvent} ${v.daysOffset > 0 ? '+' : ''}${v.daysOffset} วัน\n`; });
    contextText += "\n";
  }
  const kbSheet = sow_getSheet("AI_Knowledge");
  if (kbSheet && kbSheet.getLastRow() > 1) {
    const kbData = kbSheet.getRange(2, 1, kbSheet.getLastRow() - 1, 2).getValues();
    contextText += "--- คู่มือการใช้งานระบบและกฎฟาร์ม ---\n";
    kbData.forEach(row => { if (row[0] && row[1]) contextText += `Q: ${row[0]}\nA: ${row[1]}\n`; });
  }
  return contextText;
}

/**
 * 🤖 ฟังก์ชัน AI อ๊อดแอด — ชื่อคงเดิม (HTML เรียกใช้)
 */
function sow_askOddAdd(userMessage) {
  const apiKey = PropertiesService.getScriptProperties().getProperty(PROPS_KEYS.GEMINI_API_KEY);
  if (!apiKey || apiKey.trim() === "") {
    return "⚠️ ขออภัยครับ ผมหากุญแจ 'GEMINI_API_KEY' ใน Script Properties ไม่เจอครับ";
  }

  const stats   = sow_getDashboardData() || {};
  const context = `ข้อมูลฟาร์มปัจจุบัน: แม่หมูทั้งหมด ${stats.total_sows || 0} ตัว, รอผสม ${stats.status_wait || 0} ตัว, อุ้มท้อง ${stats.status_preg || 0} ตัว, เลี้ยงลูก ${stats.status_lac || 0} ตัว`;

  const apiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + apiKey;
  const payload = {
    contents: [{
      parts: [{
        text: "คุณคือ 'อ๊อด แอด' AI ผู้ช่วยจัดการฟาร์มหมู ร่าเริง เป็นกันเอง\n" +
              "ข้อมูลอ้างอิง: " + context + "\n\n" +
              "คำถามจากผู้ใช้: " + userMessage
      }]
    }]
  };

  try {
    const response = UrlFetchApp.fetch(apiUrl, { method: "post", contentType: "application/json", payload: JSON.stringify(payload), muteHttpExceptions: true });
    const json     = JSON.parse(response.getContentText());
    if (json.error) return "😵 เกิดข้อผิดพลาดจาก Google: " + json.error.message;
    return json.candidates[0].content.parts[0].text;
  } catch (e) {
    return "😵 อ๊อดแอดป่วย (Error): " + e.message;
  }
}

function sow_dailyFarmJob() {
  sow_runCalculationForAllSows();
  sow_updateDashboardSheet();
  sow_sendNotifications();
}

function sow_updateDashboardSheet() {
  try {
    const dashSheet   = sow_getSheet("Dashboard");
    const sowSheet    = sow_getSheet("SowRegister");
    const farrowSheet = sow_getSheet("FarrowingLog");
    if (!dashSheet || !sowSheet) return;

    const sowHeaders = sow_getHeaderMap(sowSheet);
    const sowData    = sowSheet.getRange(2, 1, sowSheet.getLastRow() - 1, sowSheet.getLastColumn()).getValues();
    let total = 0, wait = 0, preg = 0, lac = 0, rest = 0, alert = 0;

    sowData.forEach(row => {
      const status = (row[sowHeaders.statusComputed - 1] || "").toString();
      total++;
      if (status.includes("ผสม") || status.includes("กลับสัด") || status.includes("ไม่ท้อง")) wait++;
      else if (status.includes("อุ้มท้อง") || status.includes("ใกล้คลอด") || status.includes("รอตรวจ")) preg++;
      else if (status.includes("เลี้ยงลูก") || status.includes("ให้นม")) lac++;
      else if (status.includes("พักฟื้น")) rest++;
      else alert++;
    });

    let avgBornAlive = 0;
    if (farrowSheet && farrowSheet.getLastRow() > 1) {
      const fHeaders = sow_getHeaderMap(farrowSheet);
      const fData    = farrowSheet.getRange(2, fHeaders.bornAlive, farrowSheet.getLastRow() - 1, 1).getValues();
      let sumBorn = 0, countBorn = 0;
      fData.forEach(r => { if (r[0]) { sumBorn += Number(r[0]); countBorn++; } });
      avgBornAlive = countBorn > 0 ? (sumBorn / countBorn).toFixed(1) : 0;
    }

    const timestamp = UTILS_formatDate(new Date(), "yyyy-MM-dd HH:mm:ss");
    const stats = [
      ["total_sows", total, timestamp, "แม่พันธุ์ทั้งหมด"],
      ["status_wait", wait, timestamp, "รอผสม"],
      ["status_preg", preg, timestamp, "อุ้มท้อง"],
      ["status_lac", lac, timestamp, "เลี้ยงลูก"],
      ["status_rest", rest, timestamp, "พักฟื้น"],
      ["status_alert", alert, timestamp, "แจ้งเตือน/คัดทิ้ง"],
      ["avg_born_alive", avgBornAlive, timestamp, "ลูกมีชีวิตเฉลี่ย"]
    ];

    dashSheet.getRange(2, 1, dashSheet.getLastRow(), 4).clearContent();
    if (stats.length > 0) dashSheet.getRange(2, 1, stats.length, 4).setValues(stats);
    Logger.log("✅ Update Dashboard Sheet เรียบร้อยแล้ว");
  } catch (e) { Logger.log("❌ Error updating dashboard: " + e.message); }
}


/* =========================================
   🧠 5. STATUS CALCULATION ENGINE
   ========================================= */

function sow_loadConfig() {
  const cfgSheet = sow_getSheet("Config");
  if (!cfgSheet || cfgSheet.getLastRow() < 2) return {};
  const cfg = cfgSheet.getRange(2, 1, cfgSheet.getLastRow() - 1, 2).getValues();
  const obj = {};
  cfg.forEach(r => { obj[r[0]] = Number(r[1]) || r[1]; });
  return obj;
}

function sow_getLastEventDate(logs, eventTypeThai) {
  const event = logs.find(log => log.eventType === eventTypeThai);
  return event ? new Date(event.eventDate) : null;
}

function sow_computeSowStatus(sowId, logs, cfg) {
  const lastMating      = sow_getLastEventDate(logs, 'ผสมพันธุ์');
  const pregPositive    = sow_getLastEventDate(logs, 'ตรวจท้อง (พบ)');
  const pregNegative    = sow_getLastEventDate(logs, 'ตรวจท้อง (ไม่พบ)');
  const farrowDate      = sow_getLastEventDate(logs, 'คลอด');
  const weanDate        = sow_getLastEventDate(logs, 'หย่านม');
  const abortion        = sow_getLastEventDate(logs, 'แท้ง');
  const returnToEstrus  = sow_getLastEventDate(logs, 'กลับสัด');
  const today           = new Date(); today.setHours(0, 0, 0, 0);

  let status = 'พร้อมผสม', nextAction = 'พร้อมผสม', nextActionDate = null;

  if (weanDate && (!lastMating || lastMating < weanDate)) {
    const rebreedStart = sow_addDays(weanDate, cfg.min_wean_to_service_window_start);
    const rebreedEnd   = sow_addDays(weanDate, cfg.min_wean_to_service_window_end);
    if      (today < rebreedStart)               { status = 'พักฟื้น (รอผสม)';   nextAction = 'กำหนดผสมเร็วสุด'; nextActionDate = rebreedStart; }
    else if (today >= rebreedStart && today <= rebreedEnd) { status = 'พร้อมผสมใหม่'; nextAction = 'ช่วงหน้าต่างผสม'; nextActionDate = today; }
    else                                         { status = 'เลยกำหนดผสม';   nextAction = 'เลยกำหนดผสม';   nextActionDate = today; }
  } else if (farrowDate && (!weanDate || weanDate < farrowDate)) {
    const expectedWean = sow_addDays(farrowDate, cfg.wean_days_default);
    status = 'เลี้ยงลูก (ให้นม)'; nextAction = 'กำหนดหย่านม'; nextActionDate = expectedWean;
  } else if (lastMating && (!farrowDate || farrowDate < lastMating)) {
    if ((abortion && abortion > lastMating) || (returnToEstrus && returnToEstrus > lastMating) || (pregNegative && pregNegative > lastMating)) {
      status = 'พร้อมผสม'; nextAction = 'ต้องผสมใหม่'; nextActionDate = today;
    } else if (pregPositive && pregPositive > lastMating) {
      const expectedFarrow = sow_addDays(lastMating, cfg.gestation_days);
      status = sow_daysBetween(today, expectedFarrow) <= 7 ? 'ใกล้คลอด' : 'อุ้มท้อง';
      nextAction = 'กำหนดคลอด'; nextActionDate = expectedFarrow;
    } else {
      const check1 = sow_addDays(lastMating, cfg.preg_check1_day);
      const check2 = sow_addDays(lastMating, cfg.preg_check2_day);
      if      (today < check1)                   { status = 'ผสมแล้ว (รอตรวจท้อง 1)'; nextAction = 'ตรวจท้อง ครั้งที่ 1'; nextActionDate = check1; }
      else if (today >= check1 && today < check2){ status = 'รอตรวจท้อง 2';          nextAction = 'ตรวจท้อง ครั้งที่ 2'; nextActionDate = check2; }
      else                                       { status = 'เลยกำหนดตรวจท้อง';      nextAction = 'ตรวจท้องทันที';       nextActionDate = today;  }
    }
  }
  return { sowId, status, nextAction, nextActionDate };
}

function sow_runCalculationForAllSows() {
  const sheet = sow_getSheet("SowRegister");
  if (!sheet || sheet.getLastRow() < 2) return;
  const allLogsGrouped = sow_getAllLogsGroupedBySow();
  const cfg     = sow_loadConfig();
  const headers = sow_getHeaderMap(sheet);
  if (!headers.sowId || !headers.statusComputed || !headers.nextAction || !headers.calendarEventId || !headers.earTag) {
    Logger.log("Error: ไม่พบคอลัมน์ที่จำเป็นใน SowRegister"); return;
  }
  const sowRange  = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn());
  const sowValues = sowRange.getValues();
  const today     = new Date();
  Logger.log(`เริ่มคำนวณสถานะแม่สุกร ${sowValues.length} ตัว...`);

  const outputValues = sowValues.map(sowRowData => {
    const sowId = sowRowData[headers.sowId - 1];
    if (!sowId) return sowRowData;
    const result   = sow_computeSowStatus(sowId, allLogsGrouped[sowId] || [], cfg);
    const earTag   = sowRowData[headers.earTag - 1];
    const newEventId = sow_syncCalendarEvent(earTag, result.nextAction, result.nextActionDate, sowRowData[headers.calendarEventId - 1]);
    sowRowData[headers.statusComputed - 1] = result.status;
    sowRowData[headers.nextAction - 1]     = result.nextAction;
    sowRowData[headers.nextActionDate - 1] = result.nextActionDate;
    sowRowData[headers.lastUpdatedAt - 1]  = today;
    sowRowData[headers.calendarEventId - 1]= newEventId;
    return sowRowData;
  });

  sowRange.setValues(outputValues);
  Logger.log("✅ คำนวณสถานะและซิงค์ปฏิทินเรียบร้อยแล้ว");
}

function sow_runCalculationForSingleSow(row) {
  const cfg    = sow_loadConfig();
  const sheet  = sow_getSheet("SowRegister");
  const headers= sow_getHeaderMap(sheet);
  if (!headers.sowId || !headers.earTag || !headers.calendarEventId) return;
  const sowId  = sheet.getRange(row, headers.sowId).getValue();
  if (!sowId) return;
  const result   = sow_computeSowStatus(sowId, sow_getLogsForSow(sowId), cfg);
  const earTag   = sheet.getRange(row, headers.earTag).getValue();
  const newEventId = sow_syncCalendarEvent(earTag, result.nextAction, result.nextActionDate, sheet.getRange(row, headers.calendarEventId).getValue());
  sheet.getRange(row, headers.statusComputed).setValue(result.status);
  sheet.getRange(row, headers.nextAction).setValue(result.nextAction);
  sheet.getRange(row, headers.nextActionDate).setValue(result.nextActionDate);
  sheet.getRange(row, headers.lastUpdatedAt).setValue(new Date());
  sheet.getRange(row, headers.calendarEventId).setValue(newEventId);
}


/* =========================================
   🔔 6. NOTIFICATION SYSTEM
   ========================================= */

function sow_installTrigger() {
  ScriptApp.getProjectTriggers().forEach(t => {
    if (t.getHandlerFunction() === "sow_dailyFarmJob") ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger("sow_dailyFarmJob").timeBased().everyDays(1).atHour(7).create();
  Logger.log("✅ ตั้ง Trigger 'sow_dailyFarmJob' เรียบร้อยแล้ว (ทำงานทุกวัน 07:00)");
}

function sow_sendNotifications() {
  const sheet = sow_getSheet("SowRegister");
  if (!sheet || sheet.getLastRow() < 2) return;
  const headers = sow_getHeaderMap(sheet);
  const data    = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();
  const today   = new Date(); today.setHours(0, 0, 0, 0);
  const allEvents = [];

  for (const row of data) {
    const earTag       = row[headers.earTag - 1];
    const nextAction   = row[headers.nextAction - 1];
    const nextActionDate = row[headers.nextActionDate - 1];
    const parity       = row[headers.parity - 1] || 0;
    const status       = row[headers.statusComputed - 1] || "";
    const sowId        = row[headers.sowId - 1];

    if (nextActionDate && nextActionDate instanceof Date) {
      const diff = sow_daysBetween(today, nextActionDate);
      if (diff === 0) allEvents.push({ type: 'manage', earTag, action: nextAction, parity, status: "🔔 วันนี้", sowId });
      else if (diff === 1) allEvents.push({ type: 'manage', earTag, action: nextAction, parity, status: "⏰ พรุ่งนี้", sowId });
    }

    sow_checkVaccineTasksForSow(sowId, earTag, status, nextActionDate)
      .forEach(task => allEvents.push({ type: 'vaccine', earTag, action: task.vaccineName, parity, status: task.status, sowId }));
  }

  if (allEvents.length === 0) { Logger.log("No notifications to send today."); return; }

  const props    = PropertiesService.getScriptProperties();
  const token    = props.getProperty(PROPS_KEYS.LINE_TOKEN);
  const groupId  = props.getProperty(PROPS_KEYS.LINE_GROUP_ID);
  const flexMessage = sow_buildAlertCarousel(allEvents);
  UTILS_sendLineMessage(token, groupId, [{ type: "flex", altText: `🔔 งานวันนี้: ${allEvents.length} รายการ`, contents: flexMessage }]);
}

function sow_checkVaccineTasksForSow(sowId, earTag, currentStatus, nextActionDateObj) {
  const tasks = [];
  if (!nextActionDateObj || !(nextActionDateObj instanceof Date)) return tasks;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const rules = sow_getVaccineRules();
  let referenceDate = null, referenceType = "";
  if (currentStatus.includes("อุ้มท้อง") || currentStatus.includes("ใกล้คลอด")) {
    referenceDate = nextActionDateObj; referenceType = "วันคลอด";
  }
  if (!referenceDate) return tasks;
  rules.forEach(rule => {
    if (rule.refEvent === referenceType) {
      const diff = sow_daysBetween(today, sow_addDays(referenceDate, rule.daysOffset));
      if (diff === 0) tasks.push({ vaccineName: rule.name, status: "💉 วันนี้" });
      else if (diff === 1) tasks.push({ vaccineName: rule.name, status: "💉 พรุ่งนี้" });
    }
  });
  return tasks;
}

function sow_getVaccineRules() {
  const sheet = sow_getSheet("VaccineProgram");
  if (!sheet || sheet.getLastRow() < 2) return [];
  const headers = sow_getHeaderMap(sheet);
  if (!headers.vaccineName || !headers.refEvent || !headers.daysOffset) return [];
  return sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues()
    .map(row => ({ name: row[headers.vaccineName - 1], refEvent: row[headers.refEvent - 1], daysOffset: Number(row[headers.daysOffset - 1]) }))
    .filter(r => r.name && r.refEvent);
}

function sow_buildAlertCarousel(events) {
  return { type: "carousel", contents: events.map(event => sow_buildSingleAlertBubble(event)) };
}

function sow_buildSingleAlertBubble(event) {
  const { type, earTag, action, parity, status, sowId } = event;
  const webAppUrl  = getAppUrl();
  let headerColor  = "#2563eb", headerText = "โรงเรือนแม่พันธุ์";
  if (type === 'vaccine')   { headerColor = "#059669"; headerText = "💉 แจ้งเตือนวัคซีน"; }
  else if (action.includes("คลอด") || status.includes("วันนี้")) headerColor = "#ef4444";

  const header = {
    type: "box", layout: "vertical", backgroundColor: headerColor, paddingAll: "12px",
    contents: [{ type: "text", text: headerText, weight: "bold", size: "lg", color: "#ffffff" }]
  };
  const body = {
    type: "box", layout: "vertical", spacing: "md", paddingAll: "16px",
    contents: [
      sow_createKeyValueRow("🐷 เบอร์หู:", earTag, true),
      sow_createKeyValueRow("⭐ ครอกที่:", parity.toString()),
      sow_createKeyValueRow("📅 กิจกรรม:", action),
      sow_createKeyValueRow("⏰ สถานะ:", status, false, status.includes("วันนี้") ? "#ef4444" : "#2563eb")
    ]
  };
  const footerContents = [];
  if (type === 'vaccine' && status.includes("วันนี้")) {
    footerContents.push(sow_createButton("✅ ฉีดแล้ว (บันทึก)", `${webAppUrl}?action=record_vaccine&sowId=${sowId}&earTag=${earTag}&vaccine=${encodeURIComponent(action)}`));
  }
  return {
    type: "bubble", size: "mega",
    header, body,
    footer: { type: "box", layout: "vertical", contents: footerContents, paddingAll: "16px" },
    action: { type: "uri", label: "เปิดแอป", uri: webAppUrl }
  };
}

function sow_createKeyValueRow(key, value, isValueBold = false, valueColor = "#6b7280") {
  return {
    type: "box", layout: "horizontal",
    contents: [
      { type: "text", text: key,   flex: 4 },
      { type: "text", text: value, flex: 6, color: isValueBold ? "#15803d" : valueColor }
    ]
  };
}

function sow_createButton(label, url) {
  const targetUrl = (url && !url.includes("ใส่_ลิงก์")) ? url : ScriptApp.getService().getUrl();
  return { type: "button", action: { type: "uri", label, uri: targetUrl }, style: "link", color: "#15803d", height: "sm" };
}
