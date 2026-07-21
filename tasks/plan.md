# Implementation Plan: Auto Approve UI Fix (Settings Mapping)

## Overview
การแก้ไขปัญหา UI ของระบบ Auto Approve ที่ไม่สามารถบันทึกหรือจดจำค่าการตั้งค่าได้ สาเหตุเกิดจากการที่ `SettingsService` ไม่ได้ทำการแมป (Map) ฟิลด์ข้อมูลที่เกี่ยวข้องกับระบบ Auto Approve ทั้งตอนดึงข้อมูล (Fetch) และตอนบันทึก (Save) ทำให้หน้าจอ UI ไม่สามารถเชื่อมต่อกับฐานข้อมูลได้อย่างสมบูรณ์

## Architecture Decisions
- แก้ไขที่ระดับ Service Layer (`settings.service.ts`) เพื่อให้เป็น Single Source of Truth สำหรับการจัดการ System Settings ทั้งหมด
- อาศัยการทำ Serialization (JSON.stringify) และ Deserialization (JSON.parse) สำหรับฟิลด์ `auto_approve_full_days` เนื่องจากเป็นโครงสร้าง Array 

## Task List

### Phase 1: Foundation (Service Mapping)
- [x] Task 1: Update `getAllSettings` method
- [x] Task 2: Update `updateAllSettings` method

### Checkpoint: Complete
- [x] ผู้ใช้สามารถเปิด/ปิด Auto Approve และบันทึกได้
- [x] ผู้ใช้สามารถตั้งเวลาและวันหยุดพิเศษและบันทึกได้
- [x] เมื่อ Refresh หน้าจอ ข้อมูลยังคงอยู่ (Persistence)

## Risks and Mitigations
| Risk | Impact | Mitigation |
|------|--------|------------|
| JSON Parse Error | Medium | ใส่ try-catch block ครอบไว้ใน `getAllSettings` เพื่อป้องกันกรณีที่ข้อมูลในฐานข้อมูลพังหรือผิดรูปแบบ |

## Open Questions
- ไม่มี (ดำเนินการเสร็จสิ้นเรียบร้อยแล้ว)
