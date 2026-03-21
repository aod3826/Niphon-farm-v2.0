# 🚀 Quick Start — Niphon Farm Smart Center

## ✅ ไฟล์ที่ได้รับจากการ Refactor

```
0_Config.gs         ✅ ใหม่ — Master Config (ชีตทั้ง 32 + Property Keys)
0_Utils.gs          ✅ ใหม่ — Shared Utilities (LINE, Drive, PDF, Cache)
Core_DB.gs          ✅ แก้ไข — ลบ DB_Update ซ้ำ
Controller.gs       ✅ แก้ไข — ลบ hr_registerUser ซ้ำ
Module_HR.gs        ✅ แก้ไข — เพิ่ม try-catch, ลด logic ซ้ำ
Module_Farm.gs      ✅ แก้ไข — เพิ่ม try-catch, เช็คสต็อกยาด้วย
Sow_Service.gs      ✅ Refactored — ลบ SOW_CONFIG ออก
Fatten_Service.gs   ✅ Refactored — ลบ FATTEN_CONFIG ออก
Feed_Service.gs     ✅ Refactored — ลบ FEED_CONFIG ออก
Liff_Helper.gs      ✅ แก้ไข — แก้ getSheet() bug, implement sendPushMessage
```

---

## ⚡ 3 ขั้นตอนเริ่มต้น

### 1️⃣ แทนที่ไฟล์ใน Apps Script Editor

```
ขั้นตอน:
1. เปิด Google Apps Script Project ของคุณ
2. ลบไฟล์ Config.gs เดิมออก
3. เพิ่มไฟล์ใหม่: 0_Config.gs และ 0_Utils.gs
4. แทนที่ไฟล์ที่เหลือทั้งหมด (copy-paste เนื้อหาทับ)
5. ตรวจสอบลำดับไฟล์ใน sidebar — 0_Config.gs ต้องอยู่บนสุด
```

> **ℹ️ ไม่ต้องแก้ไขโค้ดใดๆ** — ทุกค่าตั้งค่าผ่าน Script Properties

---

### 2️⃣ ตั้งค่า Script Properties

เปิด **Project Settings → Script Properties → Add property**

**ค่าที่จำเป็นต้องมี (Required):**

| Property | ค่า |
|---|---|
| `SPREADSHEET_ID` | ID ของ Google Sheets หลัก |
| `LINE_TOKEN` | Channel Access Token จาก LINE Developers |
| `LINE_GROUP_ID` | Group ID ที่จะรับการแจ้งเตือน |

**ค่าเพิ่มเติมตามระบบที่ใช้ (Optional):**

| Property | ระบบ |
|---|---|
| `LIFF_ID` | LINE Mini App |
| `GEMINI_API_KEY` | AI อ๊อดแอด |
| `SOW_CALENDAR_ID` | ระบบแม่พันธุ์ |
| `SOW_IMAGE_FOLDER_ID` | ระบบแม่พันธุ์ |
| `FATTEN_IMAGE_FOLDER_ID` | ระบบหมูขุน |
| `FATTEN_PDF_FOLDER_ID` | ระบบหมูขุน |
| `FATTEN_TEMPLATE_ID` | ระบบหมูขุน (ต้นแบบใบเสร็จ) |
| `FEED_IMAGE_FOLDER_ID` | ระบบอาหาร |

---

### 3️⃣ Deploy

```
1. Deploy → New deployment → Web app
2. Execute as: Me
3. Who has access: Anyone
4. คลิก Deploy → คัดลอก URL (/exec)
5. นำ URL ไปใส่ใน LIFF Endpoint URL
```

---

## 📱 เข้าใช้งาน

**ผ่าน LINE App:**
```
https://liff.line.me/[LIFF_ID]
```

**ผ่าน Browser:**
```
[Google Apps Script Web App URL]
```

---

## 💡 Tips สำหรับ Developer

### ถ้าต้องการเพิ่มชีตใหม่
แก้ที่ `0_Config.gs` ที่เดียว:
```javascript
const SHEET = {
  // ... ชีตเดิม ...
  MY_NEW_SHEET: 'ชื่อชีตใหม่'   // ← เพิ่มตรงนี้
};
```
แล้วเรียกใช้ได้ทุกที่ด้วย `UTILS_getSheet(SHEET.MY_NEW_SHEET)`

### ถ้า LINE ไม่แจ้งเตือน
ตรวจสอบ Script Properties ว่ามี `LINE_TOKEN` และ `LINE_GROUP_ID` ถูกต้อง  
ทดสอบด้วย: `UTILS_pushLineNotify("🧪 ทดสอบ")` ใน Apps Script Console

### Response Format มาตรฐาน
```javascript
// ทุก Service ส่งกลับในรูปแบบนี้
{ success: true/false, data: {...}, message: "..." }

// สร้างด้วย
return UTILS_response(true, data, "สำเร็จ");
return UTILS_response(false, null, "เกิดข้อผิดพลาด");
```

---

## ❓ เกิดปัญหา?

อ่าน `DEPLOYMENT_CHECKLIST.md` เพื่อดู Troubleshooting ฉบับสมบูรณ์

---

**พร้อมใช้งาน!** 🎉
