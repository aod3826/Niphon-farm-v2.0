/* ==========================================================================
   📂 FILE: Feed_Service.gs  [ชุดที่ 3/4]
   คำอธิบาย: ระบบจัดการอาหาร — ผสมอาหาร, สต็อกวัตถุดิบ/ยา, เบิกจ่ายเข้าคอก
   Refactored: ลบ FEED_CONFIG ออก → ใช้ SHEET.*, PROPS_KEYS, UTILS_* แทน
   รักษาชื่อฟังก์ชันเดิมทุกตัว (API ไม่เปลี่ยน)
   ========================================================================== */


/* =========================================
   📥 1. READ DATA (Dashboard)
   ========================================= */

/**
 * ดึงข้อมูลเริ่มต้น: วัตถุดิบ + ราคา + ยา/วิตามิน + สูตรอาหาร + สูตรเสริม
 * @returns {{ materials, vitamins, formulas, supplements } | { error }}
 */
function feed_getInitialData() {
  try {
    const ss = UTILS_getSpreadsheet();

    // 1. วัตถุดิบ
    const sheetMat  = ss.getSheetByName(SHEET.FEED_MATERIALS);
    const dataMat   = sheetMat.getDataRange().getValues();

    // 2. ราคากลาง
    const sheetPrice = ss.getSheetByName(SHEET.FEED_PRICES);
    const priceMap   = {};
    if (sheetPrice) {
      sheetPrice.getDataRange().getValues().slice(1)
        .forEach(r => { if (r[0]) priceMap[r[0]] = r[1]; });
    }

    const materials = dataMat.slice(1).map(row => ({
      id:    row[0],
      name:  row[0],
      stock: row[1],
      min:   row[2],
      unit:  row[3],
      price: priceMap[row[0]] || 0
    }));

    // 3. ยาและวิตามิน
    const sheetVit = ss.getSheetByName(SHEET.FEED_VITAMINS);
    const vitamins = sheetVit.getDataRange().getValues().slice(1).map(row => ({
      id:    row[0],
      name:  row[0],
      stock: row[1],
      unit:  row[2],
      price: row[3]
    }));

    // 4. สูตรอาหาร
    const formulas = ss.getSheetByName(SHEET.FEED_FORMULAS).getDataRange().getValues();

    // 5. สูตรวิตามินเสริม
    const supplements = ss.getSheetByName(SHEET.FEED_SUPPLEMENTS).getDataRange().getValues();

    return UTILS_response(true, { materials, vitamins, formulas, supplements });

  } catch (e) {
    console.error("Error feed_getInitialData: " + e.toString());
    return UTILS_response(false, null, e.toString());
  }
}


/* =========================================
   📝 2. WRITE FUNCTIONS
   ========================================= */

/**
 * บันทึกการผสมอาหาร (Custom Mixing)
 * — ตัดสต็อกวัตถุดิบ + ยา/วิตามิน
 * — บันทึก Log
 * — ส่ง LINE Notify
 */
function feed_recordCustomMixing(data) {
  return UTILS_withLock(() => {
    const ss        = UTILS_getSpreadsheet();
    const sheetMat  = ss.getSheetByName(SHEET.FEED_MATERIALS);
    const sheetVit  = ss.getSheetByName(SHEET.FEED_VITAMINS);
    const sheetLog  = ss.getSheetByName(SHEET.FEED_LOG_MIX);

    // ราคากลาง
    const sheetPrice = ss.getSheetByName(SHEET.FEED_PRICES);
    const priceMap   = {};
    if (sheetPrice) {
      sheetPrice.getDataRange().getValues().slice(1)
        .forEach(r => { if (r[0]) priceMap[r[0]] = r[1]; });
    }

    const timestamp      = new Date();
    const mixId          = timestamp.getTime();
    let   totalCostBatch = 0;

    // 1. ตัดสต็อกวัตถุดิบ
    if (data.materials && data.materials.length > 0) {
      const matData = sheetMat.getDataRange().getValues();
      data.materials.forEach(item => {
        for (let i = 1; i < matData.length; i++) {
          if (matData[i][0] == item.name) {
            const newStock  = Number(matData[i][1]) - Number(item.used);
            const unitPrice = priceMap[item.name] || 0;
            const totalCost = Number(item.used) * unitPrice;
            sheetMat.getRange(i + 1, 2).setValue(newStock);
            sheetLog.appendRow([mixId, timestamp, data.formulaId, item.name, item.used, unitPrice, totalCost]);
            totalCostBatch += totalCost;
            break;
          }
        }
      });
    }

    // 2. ตัดสต็อกยา/วิตามิน
    if (data.vitamins && data.vitamins.length > 0) {
      const vitData = sheetVit.getDataRange().getValues();
      data.vitamins.forEach(item => {
        for (let i = 1; i < vitData.length; i++) {
          if (vitData[i][0] == item.name) {
            const newStock  = Number(vitData[i][1]) - Number(item.used);
            const unitPrice = Number(vitData[i][3]) || 0;
            const totalCost = Number(item.used) * unitPrice;
            sheetVit.getRange(i + 1, 2).setValue(newStock);
            sheetLog.appendRow([mixId, timestamp, data.formulaId, "[เสริม] " + item.name, item.used, unitPrice, totalCost]);
            totalCostBatch += totalCost;
            break;
          }
        }
      });
    }

    // 3. ส่ง LINE Notify
    const msg = `🥣 ผสมอาหาร: ${data.formulaId}\n🔢 จำนวน: ${data.qty} ชุด\n💰 ต้นทุนรวม: ${UTILS_formatNumber(totalCostBatch)} บาท\n👤 โดย: ${data.user || 'Admin'}`;
    UTILS_pushLineNotify(msg);

    return UTILS_response(true);
  });
}


/**
 * เบิกอาหารเข้าคอก (Dispense to Pen)
 * Input: { penNumber, batchId, formulaName, qty, user }
 */
function feed_dispenseToPen(data) {
  return UTILS_withLock(() => {
    const ss         = UTILS_getSpreadsheet();
    const penNumber  = data.penNumber;
    const batchId    = data.batchId;
    const formulaName = data.formulaName;
    const qty        = Number(data.qty);

    const sheetMat  = ss.getSheetByName(SHEET.FEED_MATERIALS);
    const sheetVit  = ss.getSheetByName(SHEET.FEED_VITAMINS);

    let itemsToDeduct = [];
    let totalCost     = 0;
    let logDetail     = formulaName;
    let errors        = [];

    // ตรวจสอบและเตรียมรายการตัดสต็อก (ตามสูตร)
    if (formulaName && qty > 0) {
      const sheetFormula = ss.getSheetByName(SHEET.FEED_FORMULAS);
      if (sheetFormula) {
        const fData    = sheetFormula.getDataRange().getValues();
        const fHeaders = fData[0];
        const dataVit  = sheetVit ? sheetVit.getDataRange().getValues() : [];

        // หาแถวสูตร
        const formulaRow = fData.find(r => r[0] == formulaName);
        if (formulaRow) {
          const matData = sheetMat.getDataRange().getValues();

          // ตรวจวัตถุดิบ
          fHeaders.forEach((h, idx) => {
            if (idx > 0 && formulaRow[idx]) {
              const need    = Number(formulaRow[idx]);
              const needQty = need * qty;
              for (let m = 1; m < matData.length; m++) {
                if (matData[m][0] == h) {
                  if (Number(matData[m][1]) < needQty) {
                    errors.push(`${h} (ขาด ${needQty - Number(matData[m][1])} ${matData[m][3]})`);
                  } else {
                    itemsToDeduct.push({ sheet: 'MAT', rowIndex: m + 1, current: Number(matData[m][1]), deduct: needQty });
                    totalCost += needQty * (Number(matData[m][2]) || 0);
                  }
                  break;
                }
              }
            }
          });

          // ตรวจยาเสริม (สูตรวิตามิน)
          const sheetSupp = ss.getSheetByName(SHEET.FEED_SUPPLEMENTS);
          if (sheetSupp) {
            const sData    = sheetSupp.getDataRange().getValues();
            const sHeaders = sData[0];
            const suppRow  = sData.find(r => r[0] == formulaName);
            if (suppRow) {
              sHeaders.forEach((h, idx) => {
                if (idx > 0 && suppRow[idx]) {
                  const need    = Number(suppRow[idx]);
                  const needQty = need * qty;
                  for (let v = 1; v < dataVit.length; v++) {
                    if (dataVit[v][0] == h) {
                      if (Number(dataVit[v][1]) < needQty) {
                        errors.push(`${h} (ยาขาด ${needQty - Number(dataVit[v][1])})`);
                      } else {
                        itemsToDeduct.push({ sheet: 'VIT', rowIndex: v + 1, sheetObj: sheetVit, current: Number(dataVit[v][1]), deduct: needQty });
                        totalCost += needQty * (Number(dataVit[v][3]) || 0);
                      }
                      break;
                    }
                  }
                }
              });
            }
          }
        }
      }
      if (errors.length > 0) return UTILS_response(false, null, "ของไม่พอ:\n" + errors.join("\n"));
      logDetail = `เบิกตามสูตร (${qty} ชุด)`;
    }

    // ตัดสต็อกจริง
    itemsToDeduct.forEach(action => {
      const newStock = action.current - action.deduct;
      if (action.sheet === 'MAT') {
        sheetMat.getRange(action.rowIndex, 2).setValue(newStock);
      } else if (action.sheet === 'VIT') {
        action.sheetObj.getRange(action.rowIndex, 2).setValue(newStock);
      }
    });

    // บันทึก Log
    const sheetLog = ss.getSheetByName(SHEET.FEED_LOG_DISPENSE);
    if (sheetLog) {
      sheetLog.appendRow([
        new Date(),
        UTILS_formatDate(new Date()),
        penNumber, batchId, formulaName, qty, totalCost,
        data.user || "Admin", logDetail
      ]);
    }

    // ส่ง LINE Notify
    const msg = `🚚 เบิกอาหารเข้าคอก ${penNumber}\n📦 รุ่น: ${batchId}\n🍲 รายการ: ${formulaName} (${qty})\n💰 ต้นทุน: ${UTILS_formatNumber(totalCost)} บ.`;
    UTILS_pushLineNotify(msg);

    return UTILS_response(true);
  });
}


/**
 * รับของเข้าสต็อก (Stock In)
 */
function feed_logStockIn(data) {
  return UTILS_withLock(() => {
    const ss       = UTILS_getSpreadsheet();
    const sheetLog = ss.getSheetByName(SHEET.FEED_LOG_STOCK_IN);
    const sheetMat = ss.getSheetByName(SHEET.FEED_MATERIALS);
    const sheetVit = ss.getSheetByName(SHEET.FEED_VITAMINS);

    // บันทึก Log
    sheetLog.appendRow(data.row);

    // เพิ่มสต็อก
    if (data.items && data.items.length > 0) {
      const matData = sheetMat.getDataRange().getValues();
      const vitData = sheetVit.getDataRange().getValues();

      data.items.forEach(item => {
        let found = false;
        for (let i = 1; i < matData.length; i++) {
          if (matData[i][0] == item.name) {
            sheetMat.getRange(i + 1, 2).setValue(Number(matData[i][1]) + Number(item.qty));
            found = true; break;
          }
        }
        if (!found) {
          for (let i = 1; i < vitData.length; i++) {
            if (vitData[i][0] == item.name) {
              sheetVit.getRange(i + 1, 2).setValue(Number(vitData[i][1]) + Number(item.qty));
              break;
            }
          }
        }
      });
    }

    return UTILS_response(true);
  });
}


/**
 * ปรับสต็อก (Adjust) — ของเสีย / ปรับยอด / ใช้เอง
 * @param {Object} data  { itemName, amount (+ หรือ -), reason, user }
 */
function feed_adjustStock(data) {
  return UTILS_withLock(() => {
    const ss       = UTILS_getSpreadsheet();
    const sheetMat = ss.getSheetByName(SHEET.FEED_MATERIALS);
    const sheetVit = ss.getSheetByName(SHEET.FEED_VITAMINS);
    const sheetLog = ss.getSheetByName(SHEET.FEED_LOG_ADJUST);

    const matData  = sheetMat.getDataRange().getValues();
    const vitData  = sheetVit.getDataRange().getValues();

    let targetSheet = null, targetRow = -1, currentStock = 0;

    // ค้นหาในวัตถุดิบ
    for (let i = 1; i < matData.length; i++) {
      if (matData[i][0] == data.itemName) {
        targetSheet = sheetMat; targetRow = i + 1; currentStock = Number(matData[i][1]);
        break;
      }
    }
    // ถ้าไม่เจอ ค้นหาในยา
    if (!targetSheet) {
      for (let i = 1; i < vitData.length; i++) {
        if (vitData[i][0] == data.itemName) {
          targetSheet = sheetVit; targetRow = i + 1; currentStock = Number(vitData[i][1]);
          break;
        }
      }
    }

    if (!targetSheet) return UTILS_response(false, null, "ไม่พบรายการสินค้า");

    const adjustAmt = Number(data.amount);
    targetSheet.getRange(targetRow, 2).setValue(currentStock + adjustAmt);
    sheetLog.appendRow([new Date(), data.itemName, adjustAmt, data.reason]);

    return UTILS_response(true);
  });
}


/**
 * บันทึกเหตุการณ์ทั่วไป
 */
function feed_logEvent(data) {
  try {
    const sheet = UTILS_getSheet(SHEET.FEED_LOG_EVENTS);
    sheet.appendRow([new Date(), data.event, data.imageUrl]);
    return UTILS_response(true);
  } catch (e) {
    return UTILS_response(false, null, e.toString());
  }
}


/**
 * ดึงข้อมูลรายงานภาพรวม (Placeholder — รอพัฒนาต่อ)
 */
function feed_getFullReportData() {
  const result = feed_getInitialData();
  return result;
}
