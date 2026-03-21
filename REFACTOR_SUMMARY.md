# 🐷 Niphon Farm — Refactor Summary & Migration Checklist

## 📦 ไฟล์ที่ได้รับมา (4 ชุด)

| ไฟล์ | สถานะ | หมายเหตุ |
|------|--------|----------|
| `0_Config.gs` | ✅ ใหม่ | Master Config รวมชื่อชีตทั้ง 32 ชีต + PROPS_KEYS |
| `0_Utils.gs`  | ✅ ใหม่ | Utility กลาง (Sheet cache, LINE, Drive, PDF, Response) |
| `Core_DB.gs`  | ✅ แก้ไข | ลบ DB_Update ที่ซ้ำกันออก (เหลือ 1 เวอร์ชั่น) |
| `Fatten_Service.gs` | ✅ Refactored | ลบ FATTEN_CONFIG + SHEET_NAMES ออก |
| `Feed_Service.gs`   | ✅ Refactored | ลบ FEED_CONFIG ออก |
| `Sow_Service.gs`    | ✅ Refactored | ลบ SOW_CONFIG ออก, คง THAI_ENGLISH_MAP |

## ✅ วิธีติดตั้ง (Migration Steps)

### ขั้นตอนที่ 1: ลบ/แทนที่ไฟล์เดิม
```
ใน Apps Script Editor:
1. ลบไฟล์ Config.gs เดิมออก
2. เพิ่มไฟล์ 0_Config.gs และ 0_Utils.gs (ใหม่)
3. แทนที่ Core_DB.gs, Fatten_Service.gs, Feed_Service.gs, Sow_Service.gs
4. ไฟล์ที่ไม่ต้องเปลี่ยน: Controller.gs, Module_HR.gs, Module_Farm.gs, Liff_Helper.gs
```

### ขั้นตอนที่ 2: ตรวจสอบ Script Properties
ใน Apps Script → Project Settings → Script Properties ต้องมีครบ:

| Key | ใช้โดย |
|-----|--------|
| `SPREADSHEET_ID` | ทุก Service |
| `LINE_TOKEN` | ทุก Service (ส่ง notify) |
| `LINE_GROUP_ID` | ทุก Service |
| `LINE_USER_ID` | Fatten (ถ้าไม่มี Group) |
| `SOW_CALENDAR_ID` | Sow_Service |
| `SOW_IMAGE_FOLDER_ID` | Sow_Service |
| `FATTEN_IMAGE_FOLDER_ID` | Fatten_Service |
| `FATTEN_PDF_FOLDER_ID` | Fatten_Service |
| `FATTEN_TEMPLATE_ID` | Fatten_Service |
| `FEED_IMAGE_FOLDER_ID` | Feed_Service |
| `GEMINI_API_KEY` | sow_askOddAdd |
| `LIFF_ID` | LINE Mini App |

---

## 🔍 สิ่งที่เปลี่ยนแปลง (สรุป)

### ลบออก (Removed)
- `SOW_CONFIG` — ทั้งหมด (แทนด้วย `SHEET.*` + `PROPS_KEYS.*`)
- `FATTEN_CONFIG` — ทั้งหมด (แทนด้วย `SHEET.*` + `PROPS_KEYS.*`)
- `FEED_CONFIG` — ทั้งหมด (แทนด้วย `SHEET.*` + `PROPS_KEYS.*`)
- `SHEET_NAMES` (local ใน Fatten) — แทนด้วย `SHEET.*`
- `_scriptProps` (local ใน Feed) — แทนด้วย `PROPS_KEYS.*`
- `DB_Update` ซ้ำ — เหลือ 1 เวอร์ชั่น
- `fatten_getHeaderMap()` — แทนด้วย `UTILS_getHeaderMap()`
- `fatten_pushLineMessage()` — แทนด้วย `UTILS_pushLineNotify()`
- `feed_sendLineMessage()` — แทนด้วย `UTILS_pushLineNotify()`
- `sow_sendLinePushMessage()` — แทนด้วย `UTILS_sendLineMessage()`
- `sow_uploadImageAndGetUrl()` — ยังคงมี แต่ภายในเรียก `UTILS_uploadFileToDrive()`
- `UTILS_DateNow()` และ `UTILS_GetDistance()` — ย้ายจาก Core_DB ไป 0_Utils.gs

### คงเดิม 100% (Unchanged)
- ชื่อฟังก์ชันทุกตัวที่ HTML เรียกใช้
- `THAI_ENGLISH_MAP` — คงเดิม (ใช้เฉพาะ Sow)
- Logic การคำนวณสถานะแม่หมูทั้งหมด
- `sow_getHeaderMap()` — คงชื่อเดิม แต่ใช้ `UTILS_getHeaderMap()` ภายใน
- `sow_getSheet()` — คงชื่อเดิม แต่ใช้ `UTILS_getSheet()` ภายใน
- `Controller.gs` — ไม่ต้องแก้ไข
- `Module_HR.gs` — ไม่ต้องแก้ไข
- `Module_Farm.gs` — ไม่ต้องแก้ไข

---

## 🏗️ โครงสร้างใหม่ (ลำดับการโหลด)

```
0_Config.gs      ← โหลดก่อน (ตัวเลข 0 ทำให้โหลดก่อนเสมอ)
0_Utils.gs       ← โหลดที่ 2
Core_DB.gs       ← DB CRUD functions
Controller.gs    ← doGet + routing
Module_HR.gs     ← HR logic
Module_Farm.gs   ← Farm overview
Sow_Service.gs   ← แม่พันธุ์
Fatten_Service.gs← หมูขุน
Feed_Service.gs  ← อาหาร
Liff_Helper.gs   ← LINE Mini App
```

---

## ⚠️ หมายเหตุสำคัญ

1. **Response Format**: `Feed_Service` และ `Fatten_Service` ตอบกลับเป็น
   `{ success, data, message }` มาตรฐาน — ถ้า HTML ทำ `JSON.parse()` เอง
   ตรวจสอบว่า property ที่อ่านยังถูกต้อง (เช่น `result.data.url` แทน `result.url`)

2. **Fatten ยังคง** `JSON.stringify()` ล้อมรอบ เพื่อรักษา compatibility กับ HTML เดิม

3. **ถ้าเพิ่มชีตใหม่**: แก้ที่ `SHEET` object ใน `0_Config.gs` ที่เดียว แล้วเรียก `SHEET.ชื่อKey` ในทุกที่
