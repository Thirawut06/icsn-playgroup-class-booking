/**
 * -----------------------------------------------------------------------------
 * ICSN Playgroup - Google Sheets Smart Sync Webhook
 * -----------------------------------------------------------------------------
 * การติดตั้ง:
 * 1. เปิด Google Sheets ที่ต้องการใช้งาน
 * 2. ไปที่ ส่วนขยาย (Extensions) > Apps Script
 * 3. เปิดไฟล์ `playgroup-website.gs` เดิม ลบโค้ดทั้งหมดทิ้ง แล้วก๊อปปี้โค้ดนี้ไปวางทับ
 * 4. กด บันทึก (Save)
 * 5. กด การทำให้ใช้งานได้ (Deploy) > การจัดการการทำให้ใช้งานได้ (Manage deployments)
 * 6. กด รูปดินสอ (Edit) มุมขวาบน -> เลือกเวอร์ชัน: ใหม่ (New version) -> กด การทำให้ใช้งานได้ (Deploy)
 */

function authorizeAndTestSheets() {
  var spreadsheet = SpreadsheetApp.openById("1Draw8NNSHk7rv11YF_uDTGQcNc_0qFnNJfnyrFHK16A");
  Logger.log("Sheets access OK. Found spreadsheet: " + spreadsheet.getName());
}

function doPost(e) {
  try {
    var payload = JSON.parse(e.postData.contents);
    var spreadsheet = SpreadsheetApp.openById("1Draw8NNSHk7rv11YF_uDTGQcNc_0qFnNJfnyrFHK16A");

    // -----------------------------------------------------------------
    // ระบบ APPEND: สำหรับหน้าฟอร์มเก่า (Form Responses 1)
    // -----------------------------------------------------------------
    if (payload.action === 'append_row') {
      var firstSheet = spreadsheet.getSheetByName("Form Responses 1") || spreadsheet.getSheets()[0];
      firstSheet.appendRow(payload.rowData);
      return ContentService.createTextOutput(JSON.stringify({ "status": "success", "message": "Row appended successfully" })).setMimeType(ContentService.MimeType.JSON);
    }

    if (payload.action === 'update_drive_link') {
      var firstSheet = spreadsheet.getSheetByName("Form Responses 1") || spreadsheet.getSheets()[0];
      var dataRange = firstSheet.getDataRange();
      var values = dataRange.getValues();
      var transactionId = payload.transactionId;
      var type = payload.type; 
      var fileUrl = payload.url;

      var targetRow = -1;
      for (var i = 0; i < values.length; i++) {
        if (values[i][35] === transactionId) {
          targetRow = i + 1;
          break;
        }
      }

      if (targetRow !== -1) {
        var colIndex;
        if (type === 'slip') colIndex = 23;
        else if (type === 'parent_photo') colIndex = 8;
        else if (type === 'child_photo') colIndex = 12;

        if (colIndex) {
          firstSheet.getRange(targetRow, colIndex).setValue(fileUrl);
        }
      }
      return ContentService.createTextOutput(JSON.stringify({ "status": "success", "message": "Link updated successfully" })).setMimeType(ContentService.MimeType.JSON);
    }

    // -----------------------------------------------------------------
    // ระบบ SMART MERGE (Real-time Sync แบบรักษา Note) สำหรับ 4 แท็บจัดการ
    // -----------------------------------------------------------------
    if (payload.action === 'snapshot_sync') {
      if (payload.bookingData) {
        updateTabSmartMerge(spreadsheet, "📅 ประวัติการเข้าเรียนทั้งหมด", payload.bookingData);
      }
      if (payload.parentsData) {
        updateTabSmartMerge(spreadsheet, "👥 ฐานข้อมูลผู้ใช้", payload.parentsData);
      }
      if (payload.balanceData) {
        updateTabSmartMerge(spreadsheet, "💳 เครดิตคงเหลือ", payload.balanceData);
      }
      if (payload.usageData) {
        updateTabSmartMerge(spreadsheet, "📝 ประวัติการใช้เครดิต", payload.usageData);
      }

      return ContentService.createTextOutput(JSON.stringify({ "status": "success", "message": "Smart Merge updated successfully" })).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({ "status": "ignored", "message": "Unknown action" })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ "status": "error", "message": err.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Smart Merge อัปเดตข้อมูลโดยเก็บ Note เก่าเอาไว้
 * @param {SpreadsheetApp.Spreadsheet} spreadsheet 
 * @param {string} sheetName 
 * @param {Array<{id: string, values: string[]}>} incomingData 
 */
function updateTabSmartMerge(spreadsheet, sheetName, incomingData) {
  var sheet = spreadsheet.getSheetByName(sheetName);
  if (!sheet) return;

  var idColZeroIndex = 25; // คอลัมน์ Z คือ Index ที่ 25 (0-based)

  var lastRow = sheet.getLastRow();
  var lastCol = Math.max(sheet.getLastColumn(), 26); // อย่างน้อยต้องดึงถึง Z
  
  var existingData = [];
  if (lastRow > 1) {
    existingData = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
  }

  // 1. จำคู่ ID กับข้อมูลบรรทัดเก่าที่มี Note อยู่
  var existingNotesMap = {};
  for (var i = 0; i < existingData.length; i++) {
    var row = existingData[i];
    var rowId = String(row[idColZeroIndex] || '').trim();
    if (rowId) {
      existingNotesMap[rowId] = row;
    }
  }

  // 2. เตรียมสร้างข้อมูลชุดใหม่
  var newDataArray = [];
  var incomingItems = incomingData || [];

  for (var j = 0; j < incomingItems.length; j++) {
    var item = incomingItems[j];
    var itemId = String(item.id).trim();
    var newValues = item.values || [];
    
    // สร้างบรรทัดใหม่ว่างๆ
    var newRow = new Array(lastCol).fill('');
    
    // เติมข้อมูลใหม่จาก Database
    for (var k = 0; k < newValues.length; k++) {
      newRow[k] = newValues[k];
    }
    
    // ใส่รหัสลับ ID ไว้ที่คอลัมน์ Z
    newRow[idColZeroIndex] = itemId;

    // ถ้าเป็นคนเก่าที่เคยมีข้อมูลใน Sheets ให้ก๊อปปี้ Note (คอลัมน์ที่เหลือ) มาแปะด้วย
    if (existingNotesMap[itemId]) {
      var oldRow = existingNotesMap[itemId];
      // สมมติว่าข้อมูลจาก DB ยาว 10 คอลัมน์ (0 ถึง 9) เราจะก๊อปตั้งแต่คอลัมน์ที่ 10 ขึ้นไปจนถึงตัวสุดท้าย (ยกเว้น Z)
      for (var col = newValues.length; col < lastCol; col++) {
        if (col !== idColZeroIndex) {
          newRow[col] = (oldRow[col] !== undefined) ? oldRow[col] : '';
        }
      }
    }

    newDataArray.push(newRow);
  }

  // 3. ล้างกระดาน (เคลียร์เฉพาะข้อมูล ไม่ลบรูปแบบ Format/สี)
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, lastCol).clearContent();
  }
  
  // 4. เขียนข้อมูลใหม่ที่มี Note รวมอยู่ด้วยกลับเข้าไป
  if (newDataArray.length > 0) {
    var targetCols = Math.max(newDataArray[0].length, 1);
    sheet.getRange(2, 1, newDataArray.length, targetCols).setValues(newDataArray);
  }
}
