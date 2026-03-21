# ✅ Deployment Checklist — Niphon Farm Smart Center

> อัปเดตให้ตรงกับโครงสร้างหลัง Refactor (0_Config.gs / 0_Utils.gs)

---

## 📋 รายการตรวจสอบก่อน Deploy

---

### ⬜ 1. อัปโหลดไฟล์ทั้งหมดเข้า Apps Script

- [ ] ลบ `Config.gs` เดิมออก
- [ ] เพิ่ม `0_Config.gs` (ต้องอยู่บนสุดใน sidebar)
- [ ] เพิ่ม `0_Utils.gs`
- [ ] แทนที่ `Core_DB.gs`
- [ ] แทนที่ `Controller.gs`
- [ ] แทนที่ `Module_HR.gs`
- [ ] แทนที่ `Module_Farm.gs`
- [ ] แทนที่ `Sow_Service.gs`
- [ ] แทนที่ `Fatten_Service.gs`
- [ ] แทนที่ `Feed_Service.gs`
- [ ] แทนที่ `Liff_Helper.gs`
- [ ] ตรวจสอบลำดับ — `0_Config.gs` ต้องขึ้นก่อนทุกไฟล์

---

### ⬜ 2. Google Sheets — เพิ่มคอลัมน์ที่จำเป็น

- [ ] เปิดชีต `HR_Employees`
- [ ] เพิ่มคอลัมน์ **"LINE ID"** (ถ้ายังไม่มี)
- [ ] ตรวจสอบว่าชื่อตรงกับ `CONFIG.DB.HR_EMP.COL.LINE = "LINE ID"`

---

### ⬜ 3. Script Properties — ตั้งค่าทั้งหมด

เปิด **Apps Script → Project Settings → Script Properties**

**🔴 Required (จำเป็นต้องมีก่อน Deploy):**

- [ ] `SPREADSHEET_ID` = ID ของ Google Spreadsheet หลัก
- [ ] `LINE_TOKEN` = Channel Access Token (LINE Messaging API)
- [ ] `LINE_GROUP_ID` = Group ID สำหรับรับการแจ้งเตือน

**🟡 Required ตามระบบที่เปิดใช้:**

| Property | ระบบ | สถานะ |
|---|---|---|
| `LIFF_ID` | LINE Mini App | ⬜ |
| `LINE_CHANNEL_ID` | LINE Login (Optional) | ⬜ |
| `LINE_CHANNEL_SECRET` | LINE Login (Optional) | ⬜ |
| `GEMINI_API_KEY` | AI อ๊อดแอด | ⬜ |
| `SOW_CALENDAR_ID` | ปฏิทินแม่พันธุ์ | ⬜ |
| `SOW_IMAGE_FOLDER_ID` | รูปแม่หมู | ⬜ |
| `FATTEN_IMAGE_FOLDER_ID` | รูปเหตุการณ์หมูขุน | ⬜ |
| `FATTEN_PDF_FOLDER_ID` | Folder เก็บ PDF ใบเสร็จ | ⬜ |
| `FATTEN_TEMPLATE_ID` | Google Doc ต้นแบบใบเสร็จ | ⬜ |
| `FEED_IMAGE_FOLDER_ID` | รูประบบอาหาร | ⬜ |
| `LINE_USER_ID` | Fatten fallback notify | ⬜ |

---

### ⬜ 4. LINE Developers Console

- [ ] สร้าง Provider แล้ว
- [ ] สร้าง Channel (Messaging API) แล้ว — คัดลอก `LINE_TOKEN`
- [ ] สร้าง LIFF App แล้ว — คัดลอก `LIFF_ID`
- [ ] ตั้งค่า LIFF:
  - [ ] Size = Full
  - [ ] Scope = `profile`, `openid`
  - [ ] Endpoint URL = (ใส่หลัง Deploy ขั้นตอน 6)

---

### ⬜ 5. ทดสอบ Script ก่อน Deploy

เปิด **Apps Script Editor → Run** แล้วทดสอบฟังก์ชันต่อไปนี้:

```javascript
// ทดสอบ Config โหลดได้ถูกต้อง
Logger.log(CONFIG.APP_NAME);           // ต้องได้ "Niphon Farm Smart Center"
Logger.log(SHEET.SOW_REGISTER);        // ต้องได้ "แม่_ทะเบียนประวัติ"

// ทดสอบ Spreadsheet เชื่อมได้
Logger.log(UTILS_getSpreadsheet().getName());

// ทดสอบ LINE Notify (ถ้ามีค่า Token แล้ว)
UTILS_pushLineNotify("🧪 ทดสอบระบบ Niphon Farm");
```

- [ ] `CONFIG.APP_NAME` แสดงชื่อถูกต้อง
- [ ] `UTILS_getSpreadsheet()` เชื่อมต่อ Sheets ได้ ไม่ Error
- [ ] LINE ได้รับข้อความทดสอบ (ถ้าตั้ง Token แล้ว)

---

### ⬜ 6. Deploy Google Apps Script

- [ ] คลิก **Deploy → New deployment**
- [ ] Type: **Web app**
- [ ] Execute as: **Me**
- [ ] Who has access: **Anyone**
- [ ] คลิก **Deploy**
- [ ] คัดลอก **Web App URL** (ลงท้าย `/exec`)
- [ ] บันทึก URL ไว้ที่ปลอดภัย

---

### ⬜ 7. อัปเดต LIFF Endpoint URL

- [ ] ไปที่ LINE Developers Console → LIFF App
- [ ] คลิก **Edit**
- [ ] ใส่ Web App URL ใน **Endpoint URL**
- [ ] คลิก **Update**

---

### ⬜ 8. ทดสอบหลัง Deploy

**ทดสอบใน Browser:**
- [ ] เปิด Web App URL
- [ ] หน้า Home โหลดสำเร็จ
- [ ] Login ด้วย PIN ได้
- [ ] เมนู Sow / Fatten / Feed ทำงานได้
- [ ] ไม่มี Error ใน Console (F12)

**ทดสอบใน LINE App:**
- [ ] เปิด `https://liff.line.me/[LIFF_ID]`
- [ ] Auto Login จาก LINE Profile สำเร็จ
- [ ] แสดงชื่อและรูปโปรไฟล์ถูกต้อง
- [ ] ทุกเมนูทำงานได้ปกติ

---

### ⬜ 9. Security Check

- [ ] ไม่มี API Key หรือ Token อยู่ในโค้ด (ต้องอยู่ใน Script Properties เท่านั้น)
- [ ] Web App ตั้งเป็น Execute as: **Me** (ไม่ใช่ User accessing)
- [ ] Channel Secret ไม่รั่วใน Client-side HTML

---

### ⬜ 10. Post-Deploy Tasks

- [ ] ตั้ง Trigger สำหรับงานประจำวัน:
  ```javascript
  // รันใน Apps Script Console ครั้งเดียว
  sow_installTrigger(); // ตั้ง sow_dailyFarmJob ทำงานทุกวัน 07:00
  ```
- [ ] แจ้งทีมงานพร้อม URL
- [ ] ทดสอบ LINE แจ้งเตือนแม่พันธุ์ (ถ้าใช้)
- [ ] บันทึก LIFF ID, Web App URL ไว้อ้างอิง

---

## 🚨 Troubleshooting

### แอปไม่เปิดใน LINE
```
✅ ตรวจสอบ: LIFF ID ใน Script Properties ถูกต้อง
✅ ตรวจสอบ: Endpoint URL ลงท้ายด้วย /exec
✅ ตรวจสอบ: Deploy ตั้งเป็น "Anyone" แล้ว
🔧 ลอง: Deploy ใหม่อีกครั้ง (version ใหม่)
```

### ข้อมูลไม่โหลด / Error ใน Console
```
✅ ตรวจสอบ: SPREADSHEET_ID ถูกต้อง
✅ ตรวจสอบ: ชีตที่อ้างอิงมีอยู่จริงใน Spreadsheet
✅ ตรวจสอบ: ชื่อหัวตารางตรงกับที่กำหนดใน 0_Config.gs
🔧 เปิด: Apps Script → Executions เพื่อดู Error Log
```

### LINE ไม่รับการแจ้งเตือน
```
✅ ตรวจสอบ: LINE_TOKEN ยังไม่หมดอายุ
✅ ตรวจสอบ: LINE_GROUP_ID ถูกต้อง (ต้องขึ้นต้นด้วย C...)
✅ ตรวจสอบ: Bot เป็น Member ของกลุ่มแล้ว
🔧 ทดสอบ: UTILS_pushLineNotify("ทดสอบ") ใน Console
```

### ฟังก์ชันหาไม่เจอ (ReferenceError)
```
✅ ตรวจสอบ: 0_Config.gs อยู่บนสุดใน sidebar
✅ ตรวจสอบ: ไม่มีไฟล์ Config.gs เดิมค้างอยู่
✅ ตรวจสอบ: บันทึก (Save) ทุกไฟล์แล้ว
```

### PDF ไม่ถูกสร้าง
```
✅ ตรวจสอบ: FATTEN_TEMPLATE_ID ถูกต้อง
✅ ตรวจสอบ: FATTEN_PDF_FOLDER_ID ถูกต้อง
✅ ตรวจสอบ: Account มีสิทธิ์เขียนใน Drive Folder นั้น
```

---

## 🎉 Ready to Launch!

เมื่อ Checklist ผ่านทุกข้อ ระบบพร้อมใช้งาน 🚀

---

**อัปเดตล่าสุด:** หลัง Refactor v2.0 (โครงสร้าง 0_Config.gs / 0_Utils.gs)
