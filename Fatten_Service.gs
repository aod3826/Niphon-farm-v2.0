/* ==========================================================================
   📂 FILE: Fatten_Service.gs  [ชุดที่ 2/4]
   คำอธิบาย: ระบบจัดการหมูขุน (Backend)
   Refactored: ลบ FATTEN_CONFIG ออก → ใช้ SHEET.*, PROPS_KEYS, UTILS_* แทน
   รักษาชื่อฟังก์ชันเดิมทุกตัว (API ไม่เปลี่ยน)

   📌 Response Format (v2 — unified กับ Feed_Service):
   ทุกฟังก์ชันคืน plain Object { success, data, message } ตรงๆ
   GAS จัดการ serialize ให้อัตโนมัติผ่าน google.script.run
   ⚠️  ถ้า HTML เดิมทำ JSON.parse(result) ให้ลบออก แล้วใช้ result.success ได้เลย
   ========================================================================== */


/* =========================================
   📥 1. READ DATA (Dashboard)
   ========================================= */

function fatten_getDashboardData() {
  try {
    return UTILS_response(true, fatten_getDashboardDataObj());
  } catch (e) {
    return UTILS_response(false, null, e.message);
  }
}

function fatten_getDashboardDataObj() {
  const ss       = UTILS_getSpreadsheet();
  const penSheet = ss.getSheetByName(SHEET.FAT_PENS);
  if (!penSheet) throw new Error("ไม่พบชีต: " + SHEET.FAT_PENS);

  const headers = UTILS_getHeaderMap(penSheet);

  // ตรวจสอบคอลัมน์จำเป็น
  if (!headers['หมายเลขคอก'] || !headers['จำนวนคงเหลือ']) {
    throw new Error("❌ หัวตารางไม่ถูกต้อง! (ต้องมี: หมายเลขคอก, จำนวนคงเหลือ, สถานะ, สูตรอาหารปัจจุบัน, วันที่ลงหมู, รหัสรุ่น, จำนวนเริ่มต้น)");
  }

  const penDataRaw  = penSheet.getDataRange().getValues();
  const today       = new Date();

  // ดึง Settings
  let settings = { feedJuniorAge: 46, feedFattenAge: 91, targetSaleAge: 150, alertDaysBefore: 5 };
  const settingSheet = ss.getSheetByName(SHEET.FAT_SETTINGS);
  if (settingSheet && settingSheet.getLastRow() > 1) {
    settingSheet.getRange(2, 1, settingSheet.getLastRow() - 1, 2)
      .getValues().forEach(r => { if (r[0]) settings[r[0]] = r[1]; });
  }

  let pens  = [];
  let stats = { totalPigs: 0, smallPigs: 0, juniorPigs: 0, fattenPigs: 0 };
  let alerts = {};

  for (let i = 1; i < penDataRaw.length; i++) {
    const row         = penDataRaw[i];
    const penId       = row[headers['หมายเลขคอก'] - 1];
    const status      = row[headers['สถานะ'] - 1];
    const count       = parseInt(row[headers['จำนวนคงเหลือ'] - 1]) || 0;
    const currentFeed = row[headers['สูตรอาหารปัจจุบัน'] - 1];
    const startDateVal = row[headers['วันที่ลงหมู'] - 1];
    const batchId     = row[headers['รหัสรุ่น'] - 1];
    const startCount  = row[headers['จำนวนเริ่มต้น'] - 1];

    let days = 0;
    if (status === 'ใช้งาน' && startDateVal) {
      const startDate = new Date(startDateVal);
      if (!isNaN(startDate)) days = Math.ceil(Math.abs(today - startDate) / 86400000);

      stats.totalPigs += count;
      if (currentFeed === 'เล็ก')  stats.smallPigs  += count;
      else if (currentFeed === 'รุ่น') stats.juniorPigs += count;
      else if (currentFeed === 'ขุน')  stats.fattenPigs += count;

      const target   = settings.targetSaleAge  || 150;
      const warnDays = settings.alertDaysBefore || 5;
      if (days >= target - warnDays) {
        if (!alerts[penId]) alerts[penId] = [];
        alerts[penId].push({ type: 'urgent', message: `อายุ ${days} วัน (ใกล้เป้าหมาย)` });
      }
    }

    pens.push({
      penNumber:    penId,
      status:       status,
      batchId:      batchId,
      startDate:    startDateVal,
      startCount:   startCount,
      currentCount: count,
      feedFormula:  currentFeed,
      days:         days
    });
  }

  return { penData: pens, pigCounts: stats, alerts: alerts, settings: settings };
}


/* =========================================
   📝 2. WRITE FUNCTIONS
   ========================================= */

function fatten_createNewBatch(data) {
  return UTILS_withLock(() => {
    const ss       = UTILS_getSpreadsheet();
    const penSheet = ss.getSheetByName(SHEET.FAT_PENS);
    const headers  = UTILS_getHeaderMap(penSheet);

    const finder = penSheet.getRange("A:A")
      .createTextFinder(data.penNumber).matchEntireCell(true).findNext();

    if (!finder) {
      return UTILS_response(false, null, "ไม่พบเลขคอกนี้ในระบบ");
    }

    const row           = finder.getRow();
    const currentStatus = penSheet.getRange(row, headers['สถานะ']).getValue();

    if (currentStatus !== 'ว่าง' && currentStatus !== '') {
      return UTILS_response(false, null, `❌ คอก ${data.penNumber} ไม่ว่าง! (สถานะ: ${currentStatus})`);
    }

    // บันทึกข้อมูลลงคอก
    penSheet.getRange(row, headers['สถานะ']).setValue('ใช้งาน');
    penSheet.getRange(row, headers['รหัสรุ่น']).setValue(data.batchId);
    penSheet.getRange(row, headers['วันที่ลงหมู']).setValue(new Date(data.entryDate));
    penSheet.getRange(row, headers['จำนวนเริ่มต้น']).setValue(data.startCount);
    penSheet.getRange(row, headers['จำนวนคงเหลือ']).setValue(data.startCount);
    penSheet.getRange(row, headers['สูตรอาหารปัจจุบัน']).setValue(data.currentFeed);

    // บันทึก Event Log
    ss.getSheetByName(SHEET.FAT_EVENTS).appendRow([
      new Date(), data.penNumber, "การจัดการทั่วไป", "ลงหมูใหม่",
      `รุ่น ${data.batchId}`, data.startCount, "", "", "", "", "", "Admin", ""
    ]);

    // บันทึก History
    ss.getSheetByName(SHEET.FAT_HISTORY).appendRow([
      new Date(), data.batchId, data.penNumber, new Date(data.entryDate),
      "", "", data.startCount, 0, 0, 0, 0, "กำลังเลี้ยง"
    ]);

    UTILS_pushLineNotify(`🆕 ลงหมูใหม่: คอก ${data.penNumber} (${data.startCount} ตัว)`);
    return UTILS_response(true, null, "ลงทะเบียนหมูใหม่สำเร็จ");
  });
}


function fatten_logEvent(data) {
  return JSON.stringify(UTILS_withLock(() => {
    const ss         = UTILS_getSpreadsheet();
    const penSheet   = ss.getSheetByName(SHEET.FAT_PENS);
    const eventSheet = ss.getSheetByName(SHEET.FAT_EVENTS);
    const headers    = UTILS_getHeaderMap(penSheet);

    const finder = penSheet.getRange("A:A")
      .createTextFinder(data.penNumber).matchEntireCell(true).findNext();

    if (finder) {
      const row        = finder.getRow();
      const colQty     = headers['จำนวนคงเหลือ'];
      const colStatus  = headers['สถานะ'];
      const colFeed    = headers['สูตรอาหารปัจจุบัน'];
      const currentQty = parseInt(penSheet.getRange(row, colQty).getValue()) || 0;
      const qty        = parseInt(data.quantity) || 0;

      if (['พบหมูตาย', 'คัดทิ้ง', 'ย้ายออก'].includes(data.eventType)) {
        const newQty = Math.max(0, currentQty - qty);
        penSheet.getRange(row, colQty).setValue(newQty);
        if (newQty === 0) {
          penSheet.getRange(row, colStatus).setValue('ว่าง');
          penSheet.getRange(row, headers['รหัสรุ่น']).setValue('');
          penSheet.getRange(row, headers['วันที่ลงหมู']).setValue('');
          penSheet.getRange(row, headers['จำนวนเริ่มต้น']).setValue('');
          penSheet.getRange(row, colFeed).setValue('');
        }
      } else if (data.eventType === 'เปลี่ยนสูตรอาหาร') {
        penSheet.getRange(row, colFeed).setValue(data.newFeed || data.details);
      }
    }

    // Upload รูปภาพ (ถ้ามี)
    let fileUrl = "";
    if (data.fileUpload) {
      fileUrl = UTILS_uploadFileToDrive(
        PropertiesService.getScriptProperties().getProperty(PROPS_KEYS.FATTEN_IMAGE_FOLDER_ID),
        {
          base64:   data.fileUpload.base64,
          mimeType: data.fileUpload.mimeType,
          name:     data.fileUpload.name
        }
      );
    }

    eventSheet.appendRow([
      new Date(), data.penNumber, data.eventCategory, data.eventType,
      data.details || "", data.quantity || 0, data.avgWeight || "",
      data.symptoms || "", data.medicineName || "", data.medicineDose || "",
      data.destinationPen || "", "Admin", fileUrl
    ]);

    let msg = `📝 บันทึก: ${data.eventType} คอก ${data.penNumber}`;
    if (data.quantity) msg += ` (${data.quantity} ตัว)`;
    UTILS_pushLineNotify(msg);

    return UTILS_response(true, null, "บันทึกสำเร็จ");
  }));
}


function fatten_logSale(data) {
  return JSON.stringify(UTILS_withLock(() => {
    const ss           = UTILS_getSpreadsheet();
    const salesSheet   = ss.getSheetByName(SHEET.FAT_SALES);
    const penSheet     = ss.getSheetByName(SHEET.FAT_PENS);
    const historySheet = ss.getSheetByName(SHEET.FAT_HISTORY);
    const headers      = UTILS_getHeaderMap(penSheet);

    const finder = penSheet.getRange("A:A")
      .createTextFinder(data.penNumber).matchEntireCell(true).findNext();
    if (!finder) return UTILS_response(false, null, "ไม่พบคอก");

    const row        = finder.getRow();
    const colQty     = headers['จำนวนคงเหลือ'];
    const colBatch   = headers['รหัสรุ่น'];
    const colStatus  = headers['สถานะ'];
    const batchId    = penSheet.getRange(row, colBatch).getValue();
    const currentQty = parseInt(penSheet.getRange(row, colQty).getValue()) || 0;
    const sellQty    = parseInt(data.quantity) || 0;
    const newQty     = Math.max(0, currentQty - sellQty);

    // สร้างเลขใบเสร็จ
    const todayStr  = UTILS_formatDate(new Date(), "yyMMdd");
    const runNum    = (salesSheet.getLastRow() + 1).toString().padStart(3, '0');
    const receiptId = `REC-${todayStr}-${runNum}`;

    // สร้าง PDF ใบเสร็จ (props อยู่ใน fatten_createReceiptPDF แล้ว)
    const pdfUrl    = fatten_createReceiptPDF(data, receiptId, batchId);

    // บันทึกการขาย
    salesSheet.appendRow([
      new Date(), data.penNumber, batchId, new Date(data.saleDate),
      data.saleType, data.buyerName, sellQty, data.totalWeight, data.pricePerKg,
      data.totalPrice, data.fees, data.netTotal, "รอตรวจสอบ", data.notes,
      data.weighingDetails, data.feeCatching, data.feeWeighing, data.feeTransport,
      receiptId, data.buyerAddress, data.buyerPhone, pdfUrl
    ]);

    // อัปเดตจำนวนในคอก
    penSheet.getRange(row, colQty).setValue(newQty);

    // ปิดรุ่น (ถ้าขายหมด)
    if (data.sellAll === 'on' || newQty === 0) {
      const hData = historySheet.getDataRange().getValues();
      for (let i = 1; i < hData.length; i++) {
        if (String(hData[i][1]) == String(batchId)) {
          historySheet.getRange(i + 1, 5).setValue(new Date());
          historySheet.getRange(i + 1, 12).setValue("ปิดรุ่นแล้ว");
          break;
        }
      }
      penSheet.getRange(row, colStatus).setValue('ว่าง');
      penSheet.getRange(row, colQty).setValue(0);
      penSheet.getRange(row, headers['รหัสรุ่น']).setValue('');
      penSheet.getRange(row, headers['วันที่ลงหมู']).setValue('');
      penSheet.getRange(row, headers['จำนวนเริ่มต้น']).setValue('');
      penSheet.getRange(row, headers['สูตรอาหารปัจจุบัน']).setValue('');
    }

    UTILS_pushLineNotify(`💰 ขายออก: คอก ${data.penNumber} ยอด ${UTILS_formatNumber(data.netTotal)} บ.`);
    return UTILS_response(true, { url: pdfUrl }, "บันทึกการขายสำเร็จ");
  }));
}


/* =========================================
   📄 3. HELPER FUNCTIONS
   ========================================= */

/**
 * สร้าง PDF ใบเสร็จการขาย
 * เรียกใช้ UTILS_createDocPDF จาก 0_Utils.gs
 * (ชื่อฟังก์ชันคงเดิม เพราะ HTML อาจเรียกใช้ตรง)
 */
function fatten_createReceiptPDF(data, receiptId, batchId) {
  const props = PropertiesService.getScriptProperties();
  return UTILS_createDocPDF(
    props.getProperty(PROPS_KEYS.FATTEN_TEMPLATE_ID),
    props.getProperty(PROPS_KEYS.FATTEN_PDF_FOLDER_ID),
    {
      "{{date}}":        UTILS_formatDate(new Date(data.saleDate), "d/MM/yyyy"),
      "{{receiptNo}}":   receiptId,
      "{{buyer}}":       data.buyerName  || "-",
      "{{pen}}":         data.penNumber,
      "{{batch}}":       batchId         || "-",
      "{{qty}}":         data.quantity,
      "{{totalWeight}}": data.totalWeight,
      "{{price}}":       data.pricePerKg,
      "{{netTotal}}":    data.netTotal
    },
    `ใบเสร็จ_${receiptId}`
  );
}
