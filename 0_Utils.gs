/* ==========================================================================
   📂 FILE: 0_Utils.gs  [ชุดที่ 1/4]
   คำอธิบาย: ฟังก์ชันกลาง (Shared Utilities) ที่ทุก Service เรียกใช้ร่วมกัน
              แทนที่การประกาศฟังก์ชันซ้ำซ้อนในแต่ละ Service
   ========================================================================== */

// ==========================================
// 💾 1. SPREADSHEET ACCESS (Singleton)
// เปิด Spreadsheet ครั้งเดียว แล้ว Cache ไว้
// ==========================================
var _SS_INSTANCE = null;

/**
 * คืนค่า Spreadsheet instance (เปิดครั้งเดียว)
 * ทุก Service ควรเรียกผ่านฟังก์ชันนี้ ไม่ openById เอง
 */
function UTILS_getSpreadsheet() {
  if (_SS_INSTANCE) return _SS_INSTANCE;
  const id = PropertiesService.getScriptProperties().getProperty(PROPS_KEYS.SPREADSHEET_ID);
  _SS_INSTANCE = id
    ? SpreadsheetApp.openById(id)
    : SpreadsheetApp.getActiveSpreadsheet();
  return _SS_INSTANCE;
}

// ==========================================
// 📄 2. SHEET CACHE (ดึง Sheet แล้ว Cache)
// ==========================================
var _SHEET_CACHE = {};

/**
 * คืนค่า Sheet object โดยดึงจาก Cache ก่อน
 * @param {string} sheetName  ชื่อชีต (ใช้ค่าจาก SHEET.* เสมอ)
 * @returns {GoogleAppsScript.Spreadsheet.Sheet|null}
 */
function UTILS_getSheet(sheetName) {
  if (!sheetName) return null;
  if (_SHEET_CACHE[sheetName]) return _SHEET_CACHE[sheetName];
  const sheet = UTILS_getSpreadsheet().getSheetByName(sheetName);
  if (sheet) _SHEET_CACHE[sheetName] = sheet;
  else console.warn("⚠️ ไม่พบชีต: " + sheetName);
  return sheet || null;
}

// ==========================================
// 🗺️ 3. HEADER MAP CACHE
// แปลง หัวตาราง → เลขคอลัมน์
// ==========================================
var _HEADER_CACHE = {};

/**
 * คืนค่า Map ของชื่อหัวตาราง → หมายเลขคอลัมน์ (เริ่มจาก 1)
 * ใช้สำหรับระบบที่อ้างอิงคอลัมน์ด้วยชื่อภาษาไทย (เช่น Fatten, Feed)
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet
 * @returns {Object} เช่น { "หมายเลขคอก": 1, "สถานะ": 2, ... }
 */
function UTILS_getHeaderMap(sheet) {
  if (!sheet) return {};
  const name = sheet.getName();
  if (_HEADER_CACHE[name]) return _HEADER_CACHE[name];
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const map = {};
  headers.forEach((h, i) => { if (h) map[h.toString().trim()] = i + 1; });
  _HEADER_CACHE[name] = map;
  return map;
}

// ==========================================
// 📦 4. STANDARD RESPONSE FORMAT
// { success, data, message } — ใช้ทุก Service
// ==========================================

/**
 * สร้าง Response Object มาตรฐาน
 * @param {boolean} success  สำเร็จหรือไม่
 * @param {*}       data     ข้อมูลที่ต้องการส่งกลับ (optional)
 * @param {string}  message  ข้อความแจ้ง (optional)
 */
function UTILS_response(success, data, message) {
  return {
    success: !!success,
    data: data !== undefined ? data : null,
    message: message || ""
  };
}

// ==========================================
// 🔒 5. LOCK SERVICE WRAPPER
// ลดโค้ดซ้ำในทุก Write Function
// ==========================================

/**
 * รัน fn() ภายใน Script Lock อัตโนมัติ
 * คืนค่า UTILS_response() เสมอ
 * @param {Function} fn  ฟังก์ชันที่ต้องการรัน ต้องคืนค่า UTILS_response()
 */
function UTILS_withLock(fn) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) {
    return UTILS_response(false, null, "ระบบไม่ว่าง กรุณาลองใหม่อีกครั้ง");
  }
  try {
    return fn();
  } catch (e) {
    console.error("❌ UTILS_withLock Error: " + e.message);
    return UTILS_response(false, null, e.message);
  } finally {
    lock.releaseLock();
  }
}

// ==========================================
// 📅 6. DATE & NUMBER UTILITIES
// ==========================================

/** คืนวันที่เวลาปัจจุบัน รูปแบบ dd/MM/yyyy HH:mm:ss */
function UTILS_DateNow() {
  return Utilities.formatDate(new Date(), CONFIG.TIMEZONE, "dd/MM/yyyy HH:mm:ss");
}

/**
 * จัดรูปแบบวันที่
 * @param {Date}   date  วันที่
 * @param {string} fmt   รูปแบบ (default: "dd/MM/yyyy")
 */
function UTILS_formatDate(date, fmt) {
  if (!date) return "-";
  try {
    const d = date instanceof Date ? date : new Date(date);
    return Utilities.formatDate(d, CONFIG.TIMEZONE, fmt || "dd/MM/yyyy");
  } catch (e) { return "-"; }
}

/**
 * จัดรูปแบบตัวเลข (เพิ่ม comma separator)
 * @param {number} n
 */
function UTILS_formatNumber(n) {
  return Number(n || 0).toLocaleString('th-TH');
}

/**
 * คำนวณระยะทางระหว่าง 2 พิกัด (เมตร) — Haversine Formula
 */
function UTILS_GetDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const φ1 = lat1 * Math.PI / 180, φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(Δφ/2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ/2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ==========================================
// 💬 7. LINE MESSAGING API (ฟังก์ชันกลาง)
// แทนที่ fatten_pushLineMessage, feed_sendLineMessage, sow_sendLinePushMessage
// ==========================================

/**
 * ส่งข้อความผ่าน LINE Messaging API (Push Message)
 * @param {string}        token     Channel Access Token
 * @param {string}        targetId  User ID หรือ Group ID ที่จะส่ง
 * @param {string|Array}  messages  ข้อความ (string) หรือ array of message objects
 */
function UTILS_sendLineMessage(token, targetId, messages) {
  if (!token || !targetId) return;
  if (token.includes("ใส่") || targetId.includes("ใส่")) return; // ยังไม่ตั้งค่า
  const msgs = (typeof messages === 'string')
    ? [{ type: 'text', text: messages }]
    : messages;
  try {
    UrlFetchApp.fetch('https://api.line.me/v2/bot/message/push', {
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      payload: JSON.stringify({ to: targetId, messages: msgs }),
      muteHttpExceptions: true
    });
  } catch (e) {
    console.error("❌ LINE Error: " + e.message);
  }
}

/**
 * ส่งแจ้งเตือน LINE โดยดึง Token/Target จาก Script Properties อัตโนมัติ
 * ใช้แทน UTILS_sendLineMessage ในกรณีที่ไม่ต้องระบุ token เอง
 * @param {string|Array} messages  ข้อความหรือ array of message objects
 */
function UTILS_pushLineNotify(messages) {
  const props = PropertiesService.getScriptProperties();
  const token  = props.getProperty(PROPS_KEYS.LINE_TOKEN);
  const target = props.getProperty(PROPS_KEYS.LINE_GROUP_ID)
              || props.getProperty(PROPS_KEYS.LINE_USER_ID);
  UTILS_sendLineMessage(token, target, messages);
}

// ==========================================
// 🗂️ 8. GOOGLE DRIVE UTILITIES
// ==========================================

/**
 * อัปโหลดไฟล์ขึ้น Google Drive แล้วคืน URL
 * @param {string} folderId   ID ของ Drive Folder ปลายทาง
 * @param {Object} fileData   { base64: "...", mimeType: "image/jpeg", name: "file.jpg" }
 * @returns {string} URL ของไฟล์ หรือ "" ถ้าผิดพลาด
 */
function UTILS_uploadFileToDrive(folderId, fileData) {
  if (!folderId || !fileData || !fileData.base64) return "";
  try {
    const folder = DriveApp.getFolderById(folderId);
    const rawB64 = fileData.base64.includes(',')
      ? fileData.base64.split(',')[1]
      : fileData.base64;
    const blob = Utilities.newBlob(
      Utilities.base64Decode(rawB64),
      fileData.mimeType || 'application/octet-stream',
      fileData.name || 'upload'
    );
    return folder.createFile(blob)
      .setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW)
      .getUrl();
  } catch (e) {
    console.error("❌ Drive Upload Error: " + e.message);
    return "";
  }
}

// ==========================================
// 📄 9. PDF GENERATOR (จาก Google Doc Template)
// แทนที่ fatten_createReceiptPDF
// ==========================================

/**
 * สร้างไฟล์ PDF จาก Google Doc Template โดย Replace Placeholder
 * @param {string} templateId   File ID ของ Google Doc ต้นแบบ
 * @param {string} pdfFolderId  Folder ID ที่จะบันทึก PDF
 * @param {Object} replacements { "{{key}}": "value", ... }
 * @param {string} fileName     ชื่อไฟล์ PDF (ไม่ต้องมี .pdf)
 * @returns {string} URL ของไฟล์ PDF หรือ "" ถ้าผิดพลาด
 */
function UTILS_createDocPDF(templateId, pdfFolderId, replacements, fileName) {
  if (!templateId || !pdfFolderId) {
    console.error("❌ UTILS_createDocPDF: ยังไม่ตั้งค่า templateId หรือ pdfFolderId");
    return "";
  }
  try {
    const tempFile  = DriveApp.getFileById(templateId).makeCopy("Temp_" + fileName);
    const tempDoc   = DocumentApp.openById(tempFile.getId());
    const body      = tempDoc.getBody();

    for (const [placeholder, value] of Object.entries(replacements)) {
      body.replaceText(placeholder, String(value === null || value === undefined ? "-" : value));
    }
    tempDoc.saveAndClose();

    const pdfFolder = DriveApp.getFolderById(pdfFolderId);
    const pdfFile   = pdfFolder
      .createFile(tempFile.getAs(MimeType.PDF))
      .setName(fileName + ".pdf");
    pdfFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    tempFile.setTrashed(true);

    return pdfFile.getUrl();
  } catch (e) {
    console.error("❌ PDF Error: " + e.message);
    return "";
  }
}
