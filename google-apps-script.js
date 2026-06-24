// ==========================================
// ICSN PANDA PLAYGROUP - GOOGLE APPS SCRIPT
// ==========================================
// คำแนะนำ: นำโค้ดนี้ไปวางใน Google Sheet ของคุณ 
// (เมนู Extensions > Apps Script) แล้วเซฟ และกด Deploy > New Deployment
// ให้สิทธิ์ Web app รันในฐานะ "Me" และเข้าถึงได้ "Anyone"

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    
    // 1. นำไฟล์รูปไปสร้างใน Google Drive ก่อน และดึง Link กลับมา
    const driveLinks = saveImagesToDriveAsSystem(data);
    
    // 2. นำข้อมูลทั้งหมดไปลงใน Google Sheet ตามคอลัมน์เดิมแป๊ะๆ (จำลอง Google Form)
    saveToSheet(data, driveLinks);
    
    return ContentService.createTextOutput(JSON.stringify({ 
      success: true, 
      message: "Data securely processed & saved to Drive/Sheets",
      driveLinks: driveLinks
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ 
      success: false, 
      error: error.toString() 
    })).setMimeType(ContentService.MimeType.JSON);
  }
}


function saveImagesToDriveAsSystem(data) {
  const MAIN_FOLDER_NAME = "ICSN Panda Playgroup";
  const parentName = data.parentName ? data.parentName.trim() : "Unknown_Parent";
  const childNickname = data.childNickname ? data.childNickname.trim() : "Unknown_Child";
  
  // ชื่อ Sub-folder จะเป็นชื่อผู้ปกครองและชื่อเล่นเด็ก เช่น "สมชาย - น้องไข่ตุ๋น"
  const subFolderName = `${parentName} - ${childNickname}`;
  
  // --------- การค้นหาหรือสร้าง Folder หลัก ---------
  let mainFolder;
  const mainFolderIter = DriveApp.getFoldersByName(MAIN_FOLDER_NAME);
  if (mainFolderIter.hasNext()) {
    mainFolder = mainFolderIter.next();
  } else {
    mainFolder = DriveApp.createFolder(MAIN_FOLDER_NAME);
  }
  
  // --------- การค้นหาหรือสร้าง Sub Folder ย่อยของนักเรียน ---------
  let subFolder;
  const subFolderIter = mainFolder.getFoldersByName(subFolderName);
  if (subFolderIter.hasNext()) {
    subFolder = subFolderIter.next();
  } else {
    subFolder = mainFolder.createFolder(subFolderName);
  }

  // เตรียม Object รอรับล้องค์
  const driveLinks = {
    parentPhoto: "",
    childPhoto: "",
    paymentSlip: ""
  };

  // ฟังก์ชั่นย่อยสำหรับแปลง Base64 เป็นไฟล์รูปและบันทึก
  function createDriveFile(base64String, fileNameBase) {
    if (!base64String || base64String.length < 100) return "";
    
    try {
      const parts = base64String.split(',');
      const base64Data = parts[1] || parts[0];
      
      let mimeType = 'image/jpeg';
      let extension = '.jpg';
      
      if (parts[0].indexOf('data:image/png') !== -1) { mimeType = 'image/png'; extension = '.png'; }
      else if (parts[0].indexOf('data:image/gif') !== -1) { mimeType = 'image/gif'; extension = '.gif'; }
      else if (parts[0].indexOf('data:application/pdf') !== -1) { mimeType = 'application/pdf'; extension = '.pdf'; }

      const blob = Utilities.newBlob(Utilities.base64Decode(base64Data), mimeType, fileNameBase + extension);
      const newFile = subFolder.createFile(blob);
      
      // ตั้งค่าให้ไฟล์ในโฟลเดอร์นี้อ่านได้โดยผู้ที่มีลิ้งค์ (เผื่อดึงรูปไปหน้าแอดมินในอนาคต)
      // หากไม่ต้องการ สามารถลบบรรทัดล่างออกได้ครับ
      newFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      
      return newFile.getUrl(); // ส่งคืนลิ้งค์ Drive ทันที
    } catch(e) {
      return `[Error saving file: ${e.toString()}]`;
    }
  }

  const timestampForFileName = Utilities.formatDate(new Date(), "GMT+7", "yyyyMMdd_HHmmss");

  // แปลงทีละไฟล์
  if (data.parentPhoto) {
    driveLinks.parentPhoto = createDriveFile(data.parentPhoto, `Parent_${timestampForFileName}`);
  }
  if (data.childPhoto) {
    driveLinks.childPhoto = createDriveFile(data.childPhoto, `Child_${timestampForFileName}`);
  }
  if (data.paymentSlip) {
    driveLinks.paymentSlip = createDriveFile(data.paymentSlip, `Slip_${timestampForFileName}`);
  }

  return driveLinks;
}


function saveToSheet(data, driveLinks) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // ดึงชีทแรกสุดที่มีอยู่ (ซึ่งปกติจะรับจากฟอร์มเดิม)
  const sheet = ss.getSheets()[0]; 
  
  // เตรียมโครงร่างคอลัมน์ 35 ช่องตามข้อมูลดิบ Google Forms เป๊ะๆ
  const rowData = new Array(35).fill("");

  // ช่องที่ 1: วันที่และเวลา
  rowData[0] = Utilities.formatDate(new Date(), "GMT+7", "MM/dd/yyyy HH:mm:ss");
  
  // ช่องที่ 2: Status (สมมุติว่ายังไม่ได้ส่ง Notify)
  rowData[1] = "New from Web"; 
  
  // ช่องที่ 3: อีเมล์
  rowData[2] = data.parentEmail || ""; 
  
  // ช่องที่ 4: Path ตัดสินใจ
  rowData[3] = data.form_type === 'trial' ? "A free trial class / ทดลองเรียนฟรีครั้งแรก" : "Make a Payment / ชำระเงิน";

  if (data.form_type === 'trial') {
    // ---------------------------------
    // PATH A: Trial Section
    // ---------------------------------
    rowData[4] = data.trialDate || "";
    rowData[5] = data.parentName || "";
    rowData[6] = data.parentPhone || "";
    rowData[7] = driveLinks.parentPhoto || ""; 
    rowData[8] = data.childName || "";
    rowData[9] = data.childNickname || "";
    rowData[10] = data.childDob || "";
    rowData[11] = driveLinks.childPhoto || "";
    rowData[12] = data.allergy || "";
    rowData[13] = data.info || "";
    rowData[14] = data.mediaPerm ? "Yes" : "No";
    rowData[15] = data.noPhotoPerm ? "Yes" : "No";
  } 
  else {
    // ---------------------------------
    // PATH B: Payment Section
    // ---------------------------------
    rowData[16] = data.parentName || "";
    rowData[17] = data.parentPhone || "";
    rowData[18] = data.childName || "";
    rowData[19] = data.childNickname || "";
    rowData[20] = data.childDob || "";
    rowData[21] = data.packageType || "";
    rowData[22] = driveLinks.paymentSlip || "";
    rowData[23] = ""; // เลขที่ใบเสร็จ
    rowData[24] = ""; // จำนวนเงิน
    rowData[25] = data.nonRefundable ? "Yes" : "No";
    rowData[26] = data.mediaPerm ? "Yes" : "No";
    rowData[27] = data.noPhotoPerm ? "Yes" : "No";
    rowData[28] = data.startingDate || "";
  }

  // เอาข้อมูลลงบรรทัดใหม่
  sheet.appendRow(rowData);
}

// -----------------------------------------------------
// OPTIONS Request (จำเป็นมากสำหรับ Webhook ข้าม Domain CORS)
// -----------------------------------------------------
function doOptions(e) {
  // ตอบกลับ Preflight อนุมัติยิงข้ามโดเมน
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
  return ContentService.createTextOutput("").setMimeType(ContentService.MimeType.TEXT);
}
