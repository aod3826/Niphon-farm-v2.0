/* ==========================================================================
   📂 FILE: Core_DB.gs  [ชุดที่ 1/4]
   คำอธิบาย: เครื่องมือกลาง (CRUD) สำหรับอ่าน/เขียน Google Sheets
   แก้ไข: ลบ DB_Update ที่ซ้ำกัน (เหลือแค่เวอร์ชั่นสมบูรณ์เวอร์ชั่นเดียว)
   ========================================================================== */

/**
 * 📖 DB_Select — ดึงข้อมูลจากชีต แปลงเป็น Array of Objects
 * @param {string} sheetName   ชื่อชีต (ใช้ค่าจาก CONFIG.DB.*.NAME)
 * @param {Object} colMap      Column Map (ใช้ค่าจาก CONFIG.DB.*.COL)
 * @returns {Array<Object>}    Array ของ Object (row data)
 */
function DB_Select(sheetName, colMap) {
  const sheet = UTILS_getSheet(sheetName);
  if (!sheet) {
    console.error("❌ DB_Select: ไม่พบชีต: " + sheetName);
    return [];
  }

  const range = sheet.getDataRange();
  if (range.getNumRows() < 2) return []; // มีแค่หัวตาราง ไม่มีข้อมูล

  // getDisplayValues เพื่อให้ได้ค่าที่เห็นตามหน้าจอ (เช่น วันที่ที่ Format แล้ว)
  const data    = range.getDisplayValues();
  const headers = data[0];
  const rows    = data.slice(1);

  // สร้าง index map: key → column index
  const idxMap = {};
  for (const key in colMap) {
    idxMap[key] = headers.indexOf(colMap[key]);
  }

  return rows.map(row => {
    const obj = {};
    for (const key in idxMap) {
      if (idxMap[key] !== -1) obj[key] = row[idxMap[key]];
    }
    return obj;
  });
}

/**
 * ✏️ DB_Insert — เพิ่มแถวข้อมูลใหม่ลงชีต
 * @param {string} sheetName   ชื่อชีต
 * @param {Object} colMap      Column Map
 * @param {Object} dataObj     ข้อมูลที่จะบันทึก { KEY: value, ... }
 * @returns {boolean}          true ถ้าสำเร็จ
 */
function DB_Insert(sheetName, colMap, dataObj) {
  const sheet = UTILS_getSheet(sheetName);
  if (!sheet) return false;

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const newRow  = headers.map(header => {
    const foundKey = Object.keys(colMap).find(key => colMap[key] === header);
    return (foundKey && dataObj[foundKey] !== undefined) ? dataObj[foundKey] : "";
  });

  sheet.appendRow(newRow);
  return true;
}

/**
 * 🔄 DB_Update — แก้ไขข้อมูลในชีต โดยค้นหาจาก Key Column
 * @param {string} sheetName   ชื่อชีต
 * @param {Object} colMap      Column Map
 * @param {string} keyColName  ชื่อคอลัมน์ที่ใช้ค้นหา (ภาษาไทยตามชีต)
 * @param {string} keyValue    ค่าที่ต้องการค้นหา
 * @param {Object} updateData  ข้อมูลที่อัปเดต { COLMAP_KEY: newValue, ... }
 * @returns {boolean}          true ถ้าพบและอัปเดตสำเร็จ
 */
function DB_Update(sheetName, colMap, keyColName, keyValue, updateData) {
  const sheet = UTILS_getSheet(sheetName);
  if (!sheet) return false;

  const data     = sheet.getDataRange().getDisplayValues();
  const headers  = data[0];
  const keyIndex = headers.indexOf(keyColName);

  if (keyIndex === -1) {
    console.error("❌ DB_Update: ไม่พบคอลัมน์ Key: " + keyColName);
    return false;
  }

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][keyIndex]) === String(keyValue)) {
      // พบแถว → อัปเดตเฉพาะคอลัมน์ที่ระบุ
      for (const key in updateData) {
        const colName  = colMap[key];
        const colIndex = headers.indexOf(colName);
        if (colIndex !== -1) {
          sheet.getRange(i + 1, colIndex + 1).setValue(updateData[key]);
        }
      }
      return true;
    }
  }

  console.warn("⚠️ DB_Update: หาค่า Key ไม่เจอ: " + keyValue);
  return false;
}
