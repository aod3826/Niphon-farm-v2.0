# 🐷 Niphon Farm Smart Center

ระบบจัดการฟาร์มสุกรครบวงจร สร้างบน **Google Apps Script + Google Sheets**  
รองรับ **LINE Mini App** และ **Web Browser**

---

## 📦 โครงสร้างไฟล์

```
📁 Niphon Farm
│
├── 🔧 Foundation (โหลดก่อน — ชื่อขึ้นต้น 0_)
│   ├── 0_Config.gs          ← Master Config, ชื่อชีตทั้งหมด, PROPS_KEYS
│   └── 0_Utils.gs           ← Shared Utilities (Sheet Cache, LINE, Drive, PDF)
│
├── 🗄️ Database Layer
│   └── Core_DB.gs           ← DB_Select / DB_Insert / DB_Update
│
├── 🚪 Entry Point
│   └── Controller.gs        ← doGet() + Public API mapping
│
├── ⚙️ Business Logic
│   ├── Module_HR.gs         ← ระบบ HR (Login, Time Log, Leave, Payroll)
│   ├── Module_Farm.gs       ← Dashboard ภาพรวมฟาร์ม
│   ├── Sow_Service.gs       ← ระบบแม่พันธุ์ (บันทึก/คำนวณสถานะ/AI)
│   ├── Fatten_Service.gs    ← ระบบหมูขุน (คอก/เหตุการณ์/ขาย/PDF)
│   ├── Feed_Service.gs      ← ระบบอาหาร (ผสม/สต็อก/เบิกจ่าย)
│   └── Liff_Helper.gs       ← LINE Mini App (LIFF Config & Helpers)
│
└── 📄 HTML Pages
    ├── Index.html
    ├── Sow_Index.html
    ├── Fatten_Index.html
    └── Feed_Index.html
```

---

## ⚙️ Script Properties ที่ต้องตั้งค่า

เปิด **Apps Script → Project Settings → Script Properties** แล้วเพิ่มทีละรายการ:

| Property Key | ใช้โดย | หมายเหตุ |
|---|---|---|
| `SPREADSHEET_ID` | ทุก Service | ID ของ Google Spreadsheet หลัก |
| `LINE_TOKEN` | ทุก Service | Channel Access Token (LINE Messaging API) |
| `LINE_GROUP_ID` | ทุก Service | Group ID สำหรับรับการแจ้งเตือน |
| `LINE_USER_ID` | Fatten | User ID สำรอง (ถ้าไม่มี Group) |
| `LIFF_ID` | LINE Mini App | LIFF ID จาก LINE Developers Console |
| `LINE_CHANNEL_ID` | Liff_Helper | Channel ID (Optional) |
| `LINE_CHANNEL_SECRET` | Liff_Helper | Channel Secret (Optional) |
| `GEMINI_API_KEY` | sow_askOddAdd | Google AI API Key |
| `SOW_CALENDAR_ID` | Sow_Service | Google Calendar ID สำหรับนัดหมายแม่หมู |
| `SOW_IMAGE_FOLDER_ID` | Sow_Service | Drive Folder สำหรับรูปแม่หมู |
| `FATTEN_IMAGE_FOLDER_ID` | Fatten_Service | Drive Folder สำหรับรูปเหตุการณ์ |
| `FATTEN_PDF_FOLDER_ID` | Fatten_Service | Drive Folder สำหรับไฟล์ใบเสร็จ PDF |
| `FATTEN_TEMPLATE_ID` | Fatten_Service | Google Doc ID ต้นแบบใบเสร็จ |
| `FEED_IMAGE_FOLDER_ID` | Feed_Service | Drive Folder สำหรับรูปอาหาร |

---

## 🗂️ ชีต Google Sheets ที่ต้องมี (32 ชีต)

ดูชื่อชีตทั้งหมดได้ที่ `SHEET` object ใน `0_Config.gs`

**ระบบ HR** (6 ชีต): `HR_Employees`, `HR_TimeLogs`, `HR_Leaves`, `HR_Advances`, `HR_Payroll`, `HR_Documents`

**ระบบแม่พันธุ์** (11 ชีต): `แม่_ทะเบียนประวัติ`, `แม่_บันทึกผสม`, `แม่_บันทึกคลอด`, `แม่_บันทึกหย่านม`, `แม่_ทะเบียนพ่อพันธุ์`, `แม่_การใช้ยา`, `แม่_โปรแกรมวัคซีน`, `แม่_ตั้งค่า`, `แม่_แจ้งเตือน`, `แม่_แดชบอร์ด`, `แม่_ความรู้`

**ระบบหมูขุน** (5 ชีต): `ขุน_สถานะคอก`, `ขุน_เหตุการณ์`, `ขุน_การขาย`, `ขุน_ประวัติรุ่น`, `ขุน_ตั้งค่า`

**ระบบอาหาร** (10 ชีต): `อาหาร_สต็อกวัตถุดิบ`, `อาหาร_สต็อกยา`, `อาหาร_สูตรผสม`, `อาหาร_สูตรวิตามิน`, `อาหาร_ประวัติผสม`, `อาหาร_รับเข้า`, `อาหาร_ปรับสต็อก`, `อาหาร_ราคา`, `อาหาร_บันทึกเหตุการณ์`, `อาหาร_การเบิกใช้`

---

## 🚀 Deploy

1. เพิ่ม Script Properties ครบตามตารางด้านบน
2. **Deploy → New deployment → Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
3. คัดลอก Web App URL (`/exec`)
4. นำ URL ไปใส่ใน LIFF Endpoint URL (LINE Developers Console)

---

## 🛠️ การแก้ไขในอนาคต

| ต้องการแก้อะไร | แก้ที่ไหน |
|---|---|
| เปลี่ยนชื่อชีต | `0_Config.gs` → `SHEET` object |
| เพิ่ม Property Key ใหม่ | `0_Config.gs` → `PROPS_KEYS` object |
| แก้ Column mapping | `0_Config.gs` → `CONFIG.DB.*` |
| แก้ชื่อ App / พิกัดฟาร์ม | `0_Config.gs` → `CONFIG` |
| แก้ฟังก์ชัน Utility ร่วม | `0_Utils.gs` |
| แก้ฟังก์ชัน DB | `Core_DB.gs` |

---

## 📝 License

Private — Niphon Farm Internal Use Only
