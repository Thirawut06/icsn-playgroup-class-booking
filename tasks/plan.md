# Technical Specification: Day-Specific Default Session Templates (กำหนดรอบเวลาเฉพาะวัน)

## 1. Objective & User Story
- **ผู้ใช้งาน:** แอดมินโรงเรียน (Admin)
- **ปัญหาเดิม:** ปัจจุบันเมื่อสร้าง "รอบเวลา default" (Session Template) รอบเวลานั้นจะถูกนำไปสร้างในปฏิทินของ **ทุกวันทำการ** เหมือนกันหมด หากมีรอบที่จัดเฉพาะบางวัน (เช่น วันอังคาร 9.00-12.00 น.) แอดมินต้องคอยไล่กดเปิด/ปิดเองทีละวันในปฏิทิน
- **สิ่งที่ต้องการสร้าง:** ให้แอดมินสามารถกำหนดได้ว่า รอบเวลา Default นั้นๆ ให้แสดง **"เฉพาะวันในสัปดาห์"** ที่ต้องการได้ (เช่น เฉพาะวันอังคาร, หรือ เฉพาะวันจันทร์-พุธ-ศุกร์) หรือ "ทุกวันทำการ" (ค่าเริ่มต้นเดิม)

---

## 2. Technical Architecture & Database Design

### A. Database Schema (`session_templates` Table)
เพิ่ม Column ใหม่ในตาราง `session_templates`:
- **`day_of_week` (`integer[]` / `int[]` DEFAULT NULL)**
  - `NULL` หรือ `{}` ➔ ใช้กับ **ทุกวันทำการ** (Default / Backward Compatible)
  - `{1}` ➔ เฉพาะวันจันทร์
  - `{2}` ➔ เฉพาะวันอังคาร
  - `{3}` ➔ เฉพาะวันพุธ
  - `{4}` ➔ เฉพาะวันพฤหัสบดี
  - `{5}` ➔ เฉพาะวันศุกร์
  - `{6}` ➔ เฉพาะวันเสาร์
  - `{0}` ➔ เฉพาะวันอาทิตย์
  - `{1,3,5}` ➔ วันจันทร์, พุธ, ศุกร์

### B. Database RPC (`get_or_create_sessions_for_date`)
ปรับเปลี่ยนเงื่อนไขการนำ Session Template มาสร้างเป็น Session รายวัน:
- ตรวจสอบว่าวันที่ `p_date` มีค่า Day of Week ตรงกับ `template.day_of_week` หรือไม่
- หาก `template.day_of_week` เป็น `NULL` หรือความยาว 0 ➔ ให้สร้างในทุกวันทำการ
- หากระบุ `day_of_week` ➔ จะสร้างเฉพาะวันที่ `EXTRACT(DOW FROM p_date)::int` ตรงกับค่าที่ระบุเท่านั้น

### C. Backend Service (`AdminSessionService`)
- ปรับปรุง `getSessionTemplates()`, `addSessionTemplate()`, และ `updateSessionTemplate()` ให้รองรับฟิลด์ `day_of_week: number[] | null`

### D. Frontend Admin UI (`AdminTimeSlots.tsx`)
- เพิ่มตัวเลือก Checkbox ให้เลือกวันในสัปดาห์ (จันทร์ - อาทิตย์) ใน Modal เพิ่ม/แก้ไขรอบเวลา
- มีปุ่ม Toggle / Checkbox "ทุกวันทำการ"
- แสดง Badge ในตารางระบุชัดเจนว่ารอบเวลานั้นส่งผลวันไหนบ้าง (เช่น "ทุกวัน", "เฉพาะวันอังคาร", "จันทร์, พุธ, ศุกร์")

---

## 3. Success Criteria
- [ ] แอดมินสามารถสร้างรอบเวลาที่ระบุเฉพาะ "วันอังคาร" ได้
- [ ] เมื่อผู้ปกครองหรือระบบโหลดคลาสของวันอังคาร ➔ จะพบรอบเวลานี้
- [ ] เมื่อผู้ปกครองหรือระบบโหลดคลาสของวันพุธ ➔ จะ **ไม่พบ** รอบเวลานี้
- [ ] รอบเวลาเดิมที่มีอยู่แล้วยังคงใช้งานได้ตามปกติ (ไม่กระทบข้อมูลเดิม)

---

## 4. Proposed Execution Order
1. **Migration:** สร้าง `supabase/migrations/20260722020000_add_day_of_week_to_session_templates.sql`
2. **Backend Adapter/Service:** อัปเดต `admin-session.service.ts` และ Type Definition `types/index.ts`
3. **Frontend UI:** อัปเดต `AdminTimeSlots.tsx` ให้มี Day Selector และ Badges
4. **Deploy & Verify:** พุชเข้า Staging DB ทดสอบการทำงาน แล้วนำขึ้น Production
