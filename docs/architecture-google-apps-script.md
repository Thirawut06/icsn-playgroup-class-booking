# ICSN Playgroup: Google Apps Script & Supabase Architecture

## Overview
ระบบจองคลาสของ ICSN Playgroup มีการเชื่อมต่อกับ Google Services (Sheets และ Drive) โดยทำงานร่วมกับ Supabase ผ่าน Edge Functions เพื่อให้ข้อมูลซิงค์กันแบบ Real-time

ระบบนี้ประกอบด้วย **Google Apps Script (GAS) 2 ตัวที่แยกจากกันโดยสิ้นเชิง**:
1. **Sheets Webhook** (สำหรับเขียนข้อมูลลง Google Sheets)
2. **Drive Webhook** (สำหรับสร้างโฟลเดอร์และอัปโหลดไฟล์ลง Google Drive)

---

## 1. Google Sheets Webhook
- **ไฟล์ในโปรเจกต์:** `playgroup-website.gs` (เป็นเวอร์ชันล่าสุดที่รวมทุกฟังก์ชันครบ)
- **ตำแหน่งที่นำไปติดตั้ง:** นำไปติดตั้งเป็น Apps Script ของไฟล์ Google Sheets (เช่น ไฟล์ "Form Responses 1")
- **หน้าที่หลัก:**
  - `append_row`: รับข้อมูลเมื่อมีการ Submit ฟอร์ม เพื่อนำไปต่อท้ายแถวในหน้า "Form Responses 1"
  - `update_drive_link`: ค้นหาแถวที่มี `transactionId` (ในคอลัมน์ AJ) และแปะลิงก์รูป (Google Drive URL) ลงในคอลัมน์รูปภาพ (H, L, W)
  - `snapshot_sync`: ล้างข้อมูลเก่าและเทข้อมูลใหม่ทับ (Clear & Rewrite) สำหรับ 4 แท็บที่ระบบหลังบ้านจัดการ (ประวัติเข้าเรียน, ฐานข้อมูลผู้ใช้, เครดิตคงเหลือ, ประวัติการใช้เครดิต)
- **Supabase Edge Function ที่เรียกใช้:** `append-to-sheets`

---

## 2. Google Drive Webhook
- **ไฟล์ในโปรเจกต์:** `google-apps-scripts/drive-webhook.js`
- **ตำแหน่งที่นำไปติดตั้ง:** นำไปติดตั้งเป็น Apps Script โปรเจกต์เปล่าๆ ที่ผูกกับบัญชี Google Drive ของแอดมิน (ทำหน้าที่เป็น Web App เดี่ยวๆ)
- **หน้าที่หลัก:**
  - `sync_file`: รับ Base64 Data ของไฟล์รูปภาพ/สลิป จาก Supabase แล้วนำไปสร้างเป็นไฟล์ใน Google Drive
  - จัดการโฟลเดอร์หลักชื่อ `ICSN Panda Playgroup Files and Pay Slip`
  - สร้างโฟลเดอร์ย่อยเป็นชื่อผู้ปกครองพร้อมเบอร์โทร เช่น `แม่บี (น้องซี) - 0812345678`
  - **ส่งลิงก์โฟลเดอร์ (Folder URL)** และ **ลิงก์ไฟล์ (File URL)** กลับมาให้ Supabase
- **Supabase Edge Function ที่เรียกใช้:** `sync-files-to-drive` (ทำงานอัตโนมัติผ่าน Database Trigger เมื่อมีข้อมูลใหม่ใน `slip_uploads`, `children`, `bookings`)

---

## ประวัติการแก้ไขปัญหาที่สำคัญ (Changelog)

### ปัญหาที่ 1: ข้อมูลที่เพิ่ง Submit ไม่ยอมเข้าชีต "Form Responses 1"
- **สาเหตุ:** หน้าเว็บส่งคำสั่ง `append_row` ไป แต่ Webhook ปลายทางที่ทำงานอยู่เป็นโค้ดเก่าที่ยังไม่รองรับ `append_row`
- **วิธีแก้:** นำโค้ดที่รวม `append_row` และ `update_drive_link` ไปอัปเดตใน Apps Script แล้วกด Deploy แบบ **New version**

### ปัญหาที่ 2: ลิงก์รูป Drive ไม่โผล่ในชีต "Form Responses 1" สำหรับข้อมูลใหม่
- **สาเหตุ:** การคุยกันระหว่าง Edge Functions 2 ตัวใช้ ID ไม่ตรงกัน `append-to-sheets` (ตัวสร้างแถว) ใช้ ID ของแพ็กเกจ แต่ `sync-files-to-drive` (ตัวเอารูปไปแปะ) ค้นหาด้วย ID ของสลิป พอไม่ตรงกันเลยหาแถวไม่เจอ
- **วิธีแก้:** แก้ไขโค้ด Frontend (`apply/page.tsx`, `TopUpModal.tsx`) ให้ส่ง ID ของสลิป (`slipId`) ออกไปเสมอ เพื่อให้ตรงกับ `sync-files-to-drive`

### ปัญหาที่ 3: คอลัมน์ google_drive_url ในตาราง `parents` เปิดมาเป็นรูปล่าสุด ไม่ใช่โฟลเดอร์
- **สาเหตุ:** โค้ด Google Apps Script (Drive Webhook) ของเก่า ส่งเฉพาะ URL ของ "ไฟล์" ที่เพิ่งอัปโหลดกลับมาให้ Supabase ทับลงไปใน Database ทำให้ถูกอัปเดตทับเป็นไฟล์ล่าสุดตลอดเวลา
- **วิธีแก้:** แก้ไขโค้ด `google-apps-scripts/drive-webhook.js` ให้ตอบกลับทั้ง `fileUrl` และ `folderUrl` จากนั้นไปแก้โค้ด Edge Function `sync-files-to-drive` ให้บันทึก `folderUrl` ลง Database ตาราง `parents` แทน
