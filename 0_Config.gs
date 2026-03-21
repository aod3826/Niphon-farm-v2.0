/* ==========================================================================
   📂 FILE: 0_Config.gs  [ชุดที่ 1/4]
   คำอธิบาย: Master Config — แหล่งข้อมูลเดียวสำหรับ ชื่อชีต, Property Keys
              และค่าตั้งต้นของระบบ Niphon Farm ทั้งหมด
   ⚠️  ถ้าต้องการเปลี่ยนชื่อชีต หรือ Key ใดๆ แก้ที่ไฟล์นี้ที่เดียวได้เลย
   ========================================================================== */

// ==========================================
// 🏠 1. APP SETTINGS (ค่าพื้นฐาน)
// ==========================================
const CONFIG = {
  APP_NAME: "Niphon Farm Smart Center",
  TIMEZONE: "Asia/Bangkok",
  LOCATION: { LAT: 7.6266950, LNG: 100.0030960 },
  MAX_DIST_METERS: 1000,

  // ==========================================
  // DB Column Maps (ใช้โดย Core_DB / Module_HR / Module_Farm)
  // ==========================================
  DB: {
    // --- 👤 HR SYSTEM ---
    HR_EMP: {
      NAME: "HR_Employees",
      COL: {
        ID: "รหัสพนักงาน", NAME: "ชื่อ-สกุล", ROLE: "ตำแหน่ง",
        PIN: "PIN", PASS: "รหัสผ่าน", STATUS: "สถานะ",
        PHONE: "เบอร์โทร", ADDR: "ที่อยู่", BANK: "ชื่อธนาคาร",
        ACC_NO: "เลขบัญชี", IMG: "รูปโปรไฟล์", LINE: "LINE ID"
      }
    },
    HR_TIME: {
      NAME: "HR_TimeLogs",
      COL: {
        ID: "Log ID", TIME: "Timestamp", EMP_ID: "รหัสพนักงาน",
        EMP_NAME: "ชื่อ-สกุล", TYPE: "ประเภท", LATLNG: "พิกัด (GPS)",
        MAP: "แผนที่", STATUS: "สถานะ"
      }
    },
    HR_LEAVE: {
      NAME: "HR_Leaves",
      COL: {
        ID: "Leave ID", TIME: "Timestamp", EMP_ID: "รหัสพนักงาน",
        TYPE: "ประเภทลา", REASON: "เหตุผล", STATUS: "สถานะ",
        START: "วันเริ่ม", END: "วันสิ้นสุด", DAYS: "จำนวนวัน"
      }
    },
    HR_ADVANCE: {
      NAME: "HR_Advances",
      COL: {
        ID: "รหัสรายการ", REQ_DATE: "วันที่เวลาขอ", EMP_ID: "รหัสพนักงาน",
        AMT: "จำนวนเงินที่ขอ", STATUS: "สถานะ", PAY_DATE: "วันที่จ่ายเงิน/โอน"
      }
    },
    HR_PAYROLL: {
      NAME: "HR_Payroll",
      COL: {
        PERIOD: "รหัสรอบจ่าย", CUT_DATE: "วันที่ตัดรอบ",
        EMP_ID: "รหัสพนักงาน", NET: "ยอดสุทธิที่จ่าย", PDF: "ลิงก์สลิปเงินเดือน (PDF)"
      }
    },
    HR_DOC: {
      NAME: "HR_Documents",
      COL: {
        ID: "Doc ID", TIME: "Timestamp", EMP_ID: "รหัสพนักงาน",
        TYPE: "ประเภทเอกสาร", LINK: "ลิงก์ไฟล์ (Drive)"
      }
    },

    // --- 🐷 FARM SYSTEM ---
    SOW_LIST: {
      NAME: "แม่_ทะเบียนประวัติ",
      COL: {
        ID: "รหัสแม่สุกร", EAR: "เบอร์หู", BREED: "สายพันธุ์",
        STATUS_SYS: "สถานะ(ระบบ)", STATUS_USER: "สถานะ(ป้อนเอง)",
        CYCLE: "ครอกที่", UPDATE: "อัปเดตล่าสุด", IMG: "URLรูปภาพ"
      }
    },
    FAT_PEN: {
      NAME: "ขุน_สถานะคอก",
      COL: {
        ID: "หมายเลขคอก", STATUS: "สถานะ", BATCH: "รหัสรุ่น",
        AMT: "จำนวนคงเหลือ", FOOD: "สูตรอาหารปัจจุบัน"
      }
    },
    FAT_SALE: {
      NAME: "ขุน_การขาย",
      COL: {
        DATE: "วันที่ขาย", BUYER: "ผู้ซื้อ", QTY: "จำนวน",
        WEIGHT: "นน.รวม", TOTAL: "รวมเงิน", PDF: "PDF"
      }
    },
    FEED_STOCK: {
      NAME: "อาหาร_สต็อกวัตถุดิบ",
      COL: { NAME: "ชื่อวัตถุดิบ", QTY: "คงเหลือ", MIN: "ขั้นต่ำ", UNIT: "หน่วยนับ" }
    },
    FEED_MED: {
      NAME: "อาหาร_สต็อกยา",
      COL: { NAME: "ชื่อวิตามิน/ยา", QTY: "คงเหลือ", MIN: "ขั้นต่ำ", UNIT: "หน่วยนับ" }
    },
    QR_CODE: {
      NAME: "🖨️_พิมพ์_QR_Code",
      COL: { NAME: "ชื่อคอก", LINK: "ลิ้งค์ (System)" }
    }
  }
};

// ==========================================
// 🔑 2. SCRIPT PROPERTY KEYS
// (รวมชื่อ Key ทั้งหมดไว้ที่เดียว ไม่ต้องจำสะกด)
// ==========================================
const PROPS_KEYS = {
  // ระบบทั่วไป
  SPREADSHEET_ID: 'SPREADSHEET_ID',
  GEMINI_API_KEY: 'GEMINI_API_KEY',
  LIFF_ID: 'LIFF_ID',

  // LINE Messaging API
  LINE_TOKEN: 'LINE_TOKEN',
  LINE_GROUP_ID: 'LINE_GROUP_ID',
  LINE_USER_ID: 'LINE_USER_ID',

  // แม่พันธุ์ (SOW)
  SOW_CALENDAR_ID: 'SOW_CALENDAR_ID',
  SOW_IMAGE_FOLDER_ID: 'SOW_IMAGE_FOLDER_ID',

  // หมูขุน (FATTEN)
  FATTEN_IMAGE_FOLDER_ID: 'FATTEN_IMAGE_FOLDER_ID',
  FATTEN_PDF_FOLDER_ID: 'FATTEN_PDF_FOLDER_ID',
  FATTEN_TEMPLATE_ID: 'FATTEN_TEMPLATE_ID',

  // อาหาร (FEED)
  FEED_IMAGE_FOLDER_ID: 'FEED_IMAGE_FOLDER_ID'
};

// ==========================================
// 📋 3. SHEET NAMES — Single Source of Truth
// ชื่อชีตทุกแผ่นในระบบ รวบรวมไว้ที่นี่ที่เดียว
// ==========================================
const SHEET = {
  // --- 👤 HR ---
  HR_EMP:       'HR_Employees',
  HR_TIME:      'HR_TimeLogs',
  HR_LEAVE:     'HR_Leaves',
  HR_ADVANCE:   'HR_Advances',
  HR_PAYROLL:   'HR_Payroll',
  HR_DOC:       'HR_Documents',

  // --- 🐷 แม่พันธุ์ ---
  SOW_REGISTER:    'แม่_ทะเบียนประวัติ',
  SOW_BREEDING:    'แม่_บันทึกผสม',
  SOW_FARROWING:   'แม่_บันทึกคลอด',
  SOW_WEANING:     'แม่_บันทึกหย่านม',
  SOW_SIRE:        'แม่_ทะเบียนพ่อพันธุ์',
  SOW_MED:         'แม่_การใช้ยา',
  SOW_VACCINE:     'แม่_โปรแกรมวัคซีน',
  SOW_CONFIG:      'แม่_ตั้งค่า',
  SOW_NOTIFY:      'แม่_แจ้งเตือน',
  SOW_DASHBOARD:   'แม่_แดชบอร์ด',
  SOW_AI_KNOWLEDGE:'แม่_ความรู้',

  // --- 🐷 หมูขุน ---
  FAT_PENS:     'ขุน_สถานะคอก',
  FAT_EVENTS:   'ขุน_เหตุการณ์',
  FAT_SALES:    'ขุน_การขาย',
  FAT_HISTORY:  'ขุน_ประวัติรุ่น',
  FAT_SETTINGS: 'ขุน_ตั้งค่า',

  // --- 🌾 อาหาร ---
  FEED_MATERIALS:    'อาหาร_สต็อกวัตถุดิบ',
  FEED_VITAMINS:     'อาหาร_สต็อกยา',
  FEED_FORMULAS:     'อาหาร_สูตรผสม',
  FEED_SUPPLEMENTS:  'อาหาร_สูตรวิตามิน',
  FEED_LOG_MIX:      'อาหาร_ประวัติผสม',
  FEED_LOG_STOCK_IN: 'อาหาร_รับเข้า',
  FEED_LOG_ADJUST:   'อาหาร_ปรับสต็อก',
  FEED_PRICES:       'อาหาร_ราคา',
  FEED_LOG_EVENTS:   'อาหาร_บันทึกเหตุการณ์',
  FEED_LOG_DISPENSE: 'อาหาร_การเบิกใช้',

  // --- ทั่วไป ---
  QR_CODE: '🖨️_พิมพ์_QR_Code'
};

// ==========================================
// 🤖 4. LINE MINI APP CONFIG
// ==========================================
const LINE_CONFIG = {
  LIFF_ID: PropertiesService.getScriptProperties().getProperty('LIFF_ID') || "ใส่-LIFF-ID-ของคุณที่นี่",
  BOT_NAME: "Niphon Farm Bot",
  USE_LINE_LOGIN: true
};
