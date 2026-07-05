/**
 * -----------------------------------------------------------------------------
 * ICSN Playgroup - Google Sheets Sync Webhook
 * -----------------------------------------------------------------------------
 * การติดตั้ง:
 * 1. เปิด Google Sheets ที่ต้องการใช้งาน
 * 2. ไปที่ ส่วนขยาย (Extensions) > Apps Script
 * 3. ก๊อปปี้โค้ดนี้ทั้งหมดไปวางทับโค้ดเดิมใน Code.gs
 * 4. กด บันทึก (Save)
 * 5. กด การทำให้ใช้งานได้ (Deploy) > การทำให้ใช้งานได้รายการใหม่ (New deployment)
 *    - เลือกประเภท: เว็บแอป (Web App)
 *    - อธิบาย: Initial deployment
 *    - เรียกใช้ในฐานะ (Execute as): ฉัน (Me)
 *    - ผู้ที่มีสิทธิ์เข้าถึง (Who has access): ทุกคน (Anyone)
 * 6. กด การทำให้ใช้งานได้ (Deploy)
 * 7. คัดลอก Web app URL ที่ได้ ไปใส่ในตั้งค่า Webhook ของระบบ
 */

function doPost(e) {
  try {
    // อ่านข้อมูล JSON ที่ส่งมาจากระบบ
    var payload = JSON.parse(e.postData.contents);
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();

    // ทำการอัปเดตแต่ละ Tab (ใช้แบบ Snapshot Sync คือล้างของเก่าแล้วเขียนทับใหม่หมด เพื่อความแม่นยำ)
    if (payload.rosterData) {
      updateTab(spreadsheet, "📅 รายชื่อคลาสวันนี้", payload.rosterData);
    }
    
    if (payload.directoryData) {
      updateTab(spreadsheet, "👥 ฐานข้อมูลนักเรียน", payload.directoryData);
    }
    
    if (payload.balancesData) {
      updateTab(spreadsheet, "💳 เครดิตคงเหลือ", payload.balancesData);
    }
    
    if (payload.historyData) {
      updateTab(spreadsheet, "📝 ประวัติการใช้เครดิต", payload.historyData);
    }

    return ContentService.createTextOutput(JSON.stringify({ "status": "success", "message": "Sheets updated successfully" }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ "status": "error", "message": error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * ฟังก์ชันสำหรับค้นหา Tab หรือสร้างใหม่ถ้าไม่มี และทำการล้างไพ่ (Clear) เพื่อใส่ข้อมูลชุดใหม่ลงไปทับ
 */
function updateTab(spreadsheet, tabName, data2DArray) {
  if (!data2DArray || data2DArray.length === 0) return;

  var sheet = spreadsheet.getSheetByName(tabName);
  
  // ถ้าไม่มี Tab นี้ ให้สร้างขึ้นมาใหม่
  if (!sheet) {
    sheet = spreadsheet.insertSheet(tabName);
  }

  // ล้างข้อมูลเก่าทิ้งทั้งหมด
  sheet.clearContents();

  var numRows = data2DArray.length;
  var numCols = data2DArray[0].length;
  
  var range = sheet.getRange(1, 1, numRows, numCols);
  
  // เทข้อมูลใหม่ลงไปทับทั้งหมดในพริบตาเดียว
  range.setValues(data2DArray);

  // ทำตัวหนาที่ Header แถวแรก
  sheet.getRange(1, 1, 1, numCols).setFontWeight("bold").setBackground("#f3f4f6");
}
