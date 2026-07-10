function doPost(e) {
  var spreadsheetId = "1Draw8NNSHk7rv11YF_uDTGQcNc_0qFnNJfnyrFHK16A";
  var spreadsheet = SpreadsheetApp.openById(spreadsheetId);
  
  try {
    var payload = JSON.parse(e.postData.contents);
    
    // We only process 'snapshot_sync' action
    if (payload.action === 'snapshot_sync') {
      
      const updateSheet = (sheetName, dataArray) => {
        if (!dataArray || dataArray.length === 0) return;
        var sheet = spreadsheet.getSheetByName(sheetName);
        if (!sheet) return;
        
        // Clear existing data (but keep formatting)
        // Row 1 is header, so start from Row 2
        var lastRow = sheet.getLastRow();
        if (lastRow > 1) {
          sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).clearContent();
        }
        
        // Ensure there are enough rows
        var maxRows = sheet.getMaxRows();
        if (dataArray.length + 1 > maxRows) {
          sheet.insertRowsAfter(maxRows, (dataArray.length + 1) - maxRows);
        }
        
        // Write new data
        sheet.getRange(2, 1, dataArray.length, dataArray[0].length).setValues(dataArray);
      };

      updateSheet("👥 ฐานข้อมูลผู้ใช้", payload.parentsData);
      updateSheet("📝 ประวัติการใช้เครดิต", payload.usageData);
      updateSheet("📅 ประวัติการเข้าเรียนทั้งหมด", payload.bookingData);
      updateSheet("💳 เครดิตคงเหลือ", payload.balanceData);

      return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "Snapshot synced" }))
        .setMimeType(ContentService.MimeType.JSON);

    } else {
      // Fallback for old webhooks (just in case)
      const tabName = payload.tab_name;
      if (!tabName) return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "Missing tab_name" })).setMimeType(ContentService.MimeType.JSON);
      return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "Legacy append ignored in Snapshot mode" }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
