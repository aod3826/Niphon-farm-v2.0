# 🎯 LINE Mini App Integration — Niphon Farm

> อัปเดตให้ตรงกับโครงสร้างหลัง Refactor (0_Config.gs / 0_Utils.gs)

---

## 📦 ไฟล์ที่เกี่ยวข้อง

| ไฟล์ | สถานะ | รายละเอียด |
|------|------|----------|
| `0_Config.gs` | ✅ ใหม่ | `PROPS_KEYS.LIFF_ID`, `LINE_CONFIG` อยู่ที่นี่ |
| `0_Utils.gs` | ✅ ใหม่ | `UTILS_sendLineMessage()`, `UTILS_pushLineNotify()` |
| `Liff_Helper.gs` | ✅ แก้ไข | `getLIFFConfig()`, LIFF Init Script, User Mapping |
| `Controller.gs` | ✅ แก้ไข | ส่ง `liffId` ไปทุกหน้า HTML อัตโนมัติ |
| `Index.html` | คงเดิม | LIFF SDK + Auto Login |
| `Sow_Index.html` | คงเดิม | LIFF SDK |
| `Fatten_Index.html` | คงเดิม | LIFF SDK |
| `Feed_Index.html` | คงเดิม | LIFF SDK |

---

## 🚀 วิธีติดตั้ง (3 ขั้นตอน)

```
1️⃣  สร้าง LIFF App ใน LINE Developers Console
    → คัดลอก LIFF ID

2️⃣  เพิ่ม Script Properties ใน Apps Script:
    LIFF_ID = [LIFF ID ที่คัดลอก]
    LINE_TOKEN = [Channel Access Token]
    LINE_GROUP_ID = [Group ID]
    (ไม่ต้องแก้โค้ดใดๆ)

3️⃣  Deploy Web App → คัดลอก URL (/exec)
    → นำ URL ไปใส่ใน LIFF Endpoint URL
```

---

## 🔧 API ที่ใช้ได้ (หลัง Refactor)

### ใน Liff_Helper.gs (Server-side):

```javascript
getLIFFConfig()                     // ดึง LIFF_ID, CHANNEL_ID
getLIFFInitScript()                 // inject LIFF script ใน HTML
liff_mapUserToEmployee(lineId)      // เชื่อม LINE ID → Employee
liff_getUserFromLineId(lineId)      // API สำหรับ HTML เรียก
findEmployeeByLineId(lineId)        // ค้น Sheet โดยตรง (backward compat)
liff_sendPushMessage(userId, msg)   // ✅ Push ไปหา User คนเดียว (implement แล้ว)
liff_saveNotificationToken(uid, t)  // เก็บ Token per User
```

### ใน 0_Utils.gs (Server-side):

```javascript
UTILS_sendLineMessage(token, targetId, messages)  // ส่งแบบระบุ token เอง
UTILS_pushLineNotify(messages)                    // ส่งไปกลุ่มหลัก (ดึง Token อัตโนมัติ)
```

### ใน JavaScript (Client-side / ทุกหน้า HTML):

```javascript
// สถานะ
isInLINE()                 // อยู่ใน LINE Client หรือไม่
getLINEProfile()           // { userId, displayName, pictureUrl }

// การส่ง/แชร์
sendLineMessage(text)      // ส่งข้อความใน Chat (ต้องอยู่ใน LINE)
shareLINEContent(msg)      // Share Target Picker

// ฟีเจอร์พิเศษ
scanQRCode()               // สแกน QR Code → return value
closeLIFFWindow()          // ปิดหน้าต่าง LIFF
openExternalBrowser(url)   // เปิด URL ในเบราว์เซอร์ภายนอก
logoutLINE()               // Logout + reload
```

---

## 🏗️ สถาปัตยกรรม LINE Notification

```
ระบบแม่พันธุ์ (Sow_Service)
    ↓ sow_sendNotifications()
    ↓ UTILS_sendLineMessage(token, groupId, flexMessages)
    → LINE Group 📲

ระบบหมูขุน (Fatten_Service)
    ↓ UTILS_pushLineNotify("💰 ขายออก...")
    → LINE Group 📲

ระบบอาหาร (Feed_Service)
    ↓ UTILS_pushLineNotify("🥣 ผสมอาหาร...")
    → LINE Group 📲

Trigger อัตโนมัติ (sow_dailyFarmJob)
    ↓ ทุกวัน 07:00
    ↓ sow_runCalculationForAllSows()
    ↓ sow_sendNotifications()
    → Flex Message แจ้งงานวันนี้ 📲
```

---

## 📱 การแจกจ่ายให้ User

**วิธีที่ 1: ส่ง LIFF URL**
```
สวัสดีครับ นี่คือลิงก์เข้าระบบ Niphon Farm
https://liff.line.me/[LIFF_ID]

กรุณาเปิดผ่าน LINE เพื่อประสบการณ์ที่ดีที่สุด
```

**วิธีที่ 2: สร้าง QR Code**
- ไปที่ https://qr-code-generator.com/
- ใส่ LIFF URL → สร้าง QR Code → ปริ้นติดที่สำนักงาน

**วิธีที่ 3: Rich Menu ใน LINE Official Account**
- สร้าง LINE OA → ตั้งค่า Rich Menu → เพิ่มปุ่ม "เข้าระบบ" → Link LIFF URL

---

## 🔐 Security

| ข้อมูล | เก็บที่ | ห้ามเก็บที่ |
|---|---|---|
| LIFF_ID | Script Properties | HTML / JS Client |
| LINE_TOKEN | Script Properties | HTML / JS Client |
| Channel Secret | Script Properties | HTML / JS Client |
| LINE User ID | Session / Server | Local Storage |

---

## 🐛 Troubleshooting

| ปัญหา | สาเหตุที่พบบ่อย | วิธีแก้ |
|---|---|---|
| แอปไม่เปิดใน LINE | LIFF ID ผิด หรือ Endpoint URL ไม่ใช่ `/exec` | ตรวจสอบ Script Properties + Re-deploy |
| Login ไม่ได้ | Scope ใน LIFF ไม่มี `profile` | เพิ่ม Scope ใน LINE Developers Console |
| ข้อมูลไม่แสดง | ไม่พบ Function หรือ Spreadsheet Error | เปิด Apps Script → Executions ดู Log |
| LINE ไม่รับ Notify | Token หมดอายุ หรือ GROUP_ID ผิด | อัปเดต Script Properties |
| `getSheet is not defined` | ยังมีไฟล์ `Config.gs` เดิมค้างอยู่ | ลบ `Config.gs` เดิมออก ใช้ `0_Config.gs` แทน |

---

## 🎯 Use Cases

### พนักงานฟาร์ม (Mobile via LINE)
- เปิดผ่าน LINE App → Auto Login
- ลงเวลาด้วย GPS
- บันทึกข้อมูลฟาร์มทันที
- รับการแจ้งเตือนงานประจำวัน

### ผู้จัดการ (Desktop / Browser)
- เปิด Web App URL ใน Chrome
- Login ด้วย PIN
- ดูภาพรวมฟาร์ม + อนุมัติคำขอ

### เจ้าของฟาร์ม (ทั้ง Mobile และ Desktop)
- รับ Flex Message สรุปงานประจำวันทาง LINE
- เปิดดูรายงานแบบ Real-time

---

## 🚀 Roadmap

### Phase 1: ✅ เสร็จแล้ว
- LIFF Login + Auto Profile
- LINE Push Notification (แม่พันธุ์, ขุน, อาหาร)
- Flex Message แจ้งเตือนงาน

### Phase 2: (แผน)
- [ ] Rich Menu ใน LINE Official Account
- [ ] LINE Notify สรุปรายสัปดาห์
- [ ] One-tap บันทึกจากการแจ้งเตือน

### Phase 3: (อนาคต)
- [ ] AI Chatbot ในกลุ่ม LINE
- [ ] LINE Beacon สำหรับ Check-in อัตโนมัติ
- [ ] Analytics Dashboard

---

**Version:** 2.0 (หลัง Refactor)  
**Status:** ✅ Ready for Production
