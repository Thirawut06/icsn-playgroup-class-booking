## Task 1: Update `getAllSettings` method

**Description:** เพิ่มการ Mapping ฟิลด์ของ Auto Approve ให้รองรับการอ่านข้อมูลจาก Database และโหลดเข้าสู่ State เริ่มต้นของแอปพลิเคชัน

**Acceptance criteria:**
- [x] สามารถอ่าน `auto_approve_slip_enabled` จาก String 'true'/'false' ให้เป็น Boolean ได้
- [x] สามารถอ่าน `auto_approve_slip_start` และ `auto_approve_slip_end` ได้อย่างถูกต้อง
- [x] มีระบบ try-catch ครอบการ parse JSON ของ `auto_approve_full_days`

**Verification:**
- [x] Tests pass: (ไม่มีเทสเฉพาะ)
- [x] Build succeeds: `npx tsc --noEmit` ไม่เจอ Error ของ Type Mismatch
- [x] Manual check: เปิดหน้า UI แล้วพบว่าเวลาที่ตั้งไว้ก่อนหน้าถูกโหลดขึ้นมาแสดงได้ถูกต้อง

**Dependencies:** None

**Files likely touched:**
- `src/lib/services/settings.service.ts`

**Estimated scope:** Small

---

## Task 2: Update `updateAllSettings` method

**Description:** เพิ่มการแนบ Payload ของ Auto Approve เข้าไปใน array `updates` สำหรับการส่งบันทึกลง Database เมื่อผู้ใช้กดปุ่มบันทึก

**Acceptance criteria:**
- [x] ตัวแปร Boolean ถูกแปลงเป็น String ก่อนส่งเข้า DB
- [x] วันหยุดถูกทำ JSON.stringify ก่อนส่งเข้า DB
- [x] เช็คเงื่อนไข `!== undefined` ก่อน push ลง array

**Verification:**
- [x] Tests pass: (ไม่มีเทสเฉพาะ)
- [x] Build succeeds: คอมไพล์ผ่านปกติ
- [x] Manual check: กดเปลี่ยนการตั้งค่าบนหน้า UI แล้วกดบันทึก จากนั้นกด Refresh หน้าจอเพื่อยืนยันการบันทึกข้อมูล (Persistence)

**Dependencies:** None

**Files likely touched:**
- `src/lib/services/settings.service.ts`

**Estimated scope:** Small
