/**
 * -----------------------------------------------------------------------------
 * ICSN Playgroup - Google Sheets Sync Webhook
 * -----------------------------------------------------------------------------
 * การติดตั้ง:
 * 1. เปิด Google Sheets ที่ต้องการใช้งาน
 * 2. ไปที่ ส่วนขยาย (Extensions) > Apps Script
 * 3. ก๊อปปี้โค้ดนี้ทั้งหมดไปวางทับโค้ดเดิมใน Code.gs
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
    // อ่านข้อมูล JSON ที่ส่งมาจากระบบ
    var payload = JSON.parse(e.postData.contents);
    var spreadsheet = SpreadsheetApp.openById("1Draw8NNSHk7rv11YF_uDTGQcNc_0qFnNJfnyrFHK16A");

    // -----------------------------------------------------------------
    // ระบบ APPEND: สำหรับเอาข้อมูลคนกดส่งฟอร์มไปต่อท้ายในชีทแรกสุด
    // -----------------------------------------------------------------
    if (payload.action === 'append_row') {

      var firstSheet = spreadsheet.getSheetByName("Form Responses 1");
      if (!firstSheet) {
        firstSheet = spreadsheet.getSheets()[0]; // Fallback
      }
      firstSheet.appendRow(payload.rowData);

      return ContentService.createTextOutput(JSON.stringify({ "status": "success", "message": "Row appended successfully" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // -----------------------------------------------------------------
    // ระบบ LATE UPDATE: สำหรับอัปเดตลิงก์ Google Drive
    // -----------------------------------------------------------------
    if (payload.action === 'update_drive_link') {
      var firstSheet = spreadsheet.getSheetByName("Form Responses 1");
      if (!firstSheet) {
        firstSheet = spreadsheet.getSheets()[0];
      }

      var dataRange = firstSheet.getDataRange();
      var values = dataRange.getValues();
      var transactionId = payload.transactionId;
      var type = payload.type; // 'slip', 'parent_photo', 'child_photo'
      var fileUrl = payload.url;

      // หาแถวที่มี Transaction ID (สมมติว่าใส่ไว้คอลัมน์ AJ ซึ่งก็คือ index 35)
      var targetRow = -1;
      for (var i = 0; i < values.length; i++) {
        if (values[i][35] === transactionId) {
          targetRow = i + 1; // 1-based index
          break;
        }
      }

      if (targetRow !== -1) {
        var colIndex;
        if (type === 'slip') {
          colIndex = 23; // W
        } else if (type === 'parent_photo') {
          // Parent photo has two possible columns depending on Trial vs Payment
          // We will update both if we don't know the path, or just check which one has data
          // H (8) or Q (not photo, wait, Parent Photo is H (8) and there is no parent photo for Payment Path? 
          // Wait, Form Responses 1.html says: 
          // H: Individual Parent's Photo
          colIndex = 8;
        } else if (type === 'child_photo') {
          // L: Individual Child's Photo
          colIndex = 12;
        }

        if (colIndex) {
          firstSheet.getRange(targetRow, colIndex).setValue(fileUrl);
        }
      }

      return ContentService.createTextOutput(JSON.stringify({ "status": "success", "message": "Link updated successfully" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // -----------------------------------------------------------------
    // ระบบ SYNC: ทำการอัปเดตแต่ละ Tab (ใช้แบบ Snapshot Sync คือล้างของเก่าแล้วเขียนทับใหม่หมด)
    // -----------------------------------------------------------------
    if (payload.rosterData) {
      updateTab(spreadsheet, "📅 ประวัติการเข้าเรียนทั้งหมด", payload.rosterData);
    }

    if (payload.directoryData) {
      updateTab(spreadsheet, "👥 ฐานข้อมูลผู้ใช้", payload.directoryData);
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
 * -----------------------------------------------------------------------------
 * ฟังก์ชันพิเศษ: คัดลอกโครงสร้างทั้งหมดจากชีตเก่ามายังชีตใหม่
 * -----------------------------------------------------------------------------
 * วิธีใช้:
 * 1. เลือกฟังก์ชัน copyOldSheetToNewSheet ในเมนูด้านบน
 * 2. กด Run (เรียกใช้)
 * 3. รอจนกว่าจะเสร็จสมบูรณ์ ชีตใหม่ของคุณจะมี Tab เหมือนชีตเก่าเป๊ะๆ พร้อมสูตรทั้งหมด!
 */
function copyOldSheetToNewSheet() {
  var oldSpreadsheetId = "1rUHowh78QmrAaKqLqN2aQJUGwZXLtoL21Sbh7bgjyc8";
  var newSpreadsheetId = "1Draw8NNSHk7rv11YF_uDTGQcNc_0qFnNJfnyrFHK16A";
  
  var oldSs = SpreadsheetApp.openById(oldSpreadsheetId);
  var newSs = SpreadsheetApp.openById(newSpreadsheetId);
  
  var oldSheets = oldSs.getSheets();
  
  Logger.log("Starting to copy " + oldSheets.length + " sheets...");
  
  for (var i = 0; i < oldSheets.length; i++) {
    var sheet = oldSheets[i];
    var sheetName = sheet.getName();
    
    Logger.log("Copying: " + sheetName);
    
    // ลบชีตชื่อซ้ำในชีตใหม่ทิ้งก่อน (ถ้ามี)
    var existingSheet = newSs.getSheetByName(sheetName);
    if (existingSheet) {
      // ป้องกันการลบชีตสุดท้าย (Google Sheets ห้ามลบชีตทั้งหมด)
      if (newSs.getSheets().length > 1) {
        newSs.deleteSheet(existingSheet);
      } else {
        existingSheet.setName(sheetName + "_old");
      }
    }
    
    // คัดลอกชีตไปยังชีตใหม่
    var copiedSheet = sheet.copyTo(newSs);
    
    // เปลี่ยนชื่อให้ตรงกับของเดิม (ระบบจะเติมคำว่า "Copy of " ให้อัตโนมัติ จึงต้องแก้กลับ)
    copiedSheet.setName(sheetName);
  }
  
  // ลบชีตเริ่มต้นที่อาจหลงเหลืออยู่ (Sheet1 หรือ _old)
  var finalSheets = newSs.getSheets();
  for (var j = 0; j < finalSheets.length; j++) {
    if (finalSheets[j].getName() === "Sheet1" || finalSheets[j].getName().endsWith("_old")) {
      newSs.deleteSheet(finalSheets[j]);
    }
  }
  
  Logger.log("✅ Copy completed successfully!");
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
