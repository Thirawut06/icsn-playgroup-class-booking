// ==========================================
// ICSN PANDA PLAYGROUP - GOOGLE APPS SCRIPT
// ==========================================
// คำแนะนำ: นำโค้ดนี้ไปวางใน Google Sheet ของคุณ 
// (เมนู Extensions > Apps Script) แล้วเซฟ และกด Deploy > New Deployment
// ให้สิทธิ์ Web app รันในฐานะ "Me" และเข้าถึงได้ "Anyone"

const MAIN_FOLDER_NAME = "ICSN Panda Playgroup Files and Pay Slip";

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    
    if (data.action === 'sync_file') {
      const driveUrl = handleFileSync(data);
      return ContentService.createTextOutput(JSON.stringify({ 
        success: true, 
        message: "File synced to Drive",
        url: driveUrl
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // หากมี Action อื่นๆ เช่น บันทึกลง Sheet ให้เพิ่มตรงนี้ได้
    
    return ContentService.createTextOutput(JSON.stringify({ 
      success: true, 
      message: "Data received but no matching action"
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ 
      success: false, 
      error: error.toString() 
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function handleFileSync(data) {
  const parentFolderName = data.parentFolderName || "Unknown_Parent";
  const parentPhone = data.parentPhone || "";
  const subFolderName = data.subFolderName || "";
  const fileName = data.fileName || "unknown_file";
  const base64Data = data.base64Data;
  const mimeType = data.mimeType || "application/octet-stream";
  
  if (!base64Data) throw new Error("No file data provided");

  // แก้ต้นเหตุ: ใช้ Folder ID ที่มีอยู่แล้วโดยตรง แทนการค้นหาชื่อหรือสร้างใหม่
  const MAIN_FOLDER_ID = "1xjcWjvRbE7qre-c8PUpMqnks3BY2VTpN";
  let mainFolder;
  try {
    mainFolder = DriveApp.getFolderById(MAIN_FOLDER_ID);
  } catch (e) {
    throw new Error("Cannot find the specified Google Drive folder. Please check if the ID is correct and the script has access.");
  }
  
  // 2. ค้นหาโฟลเดอร์ผู้ปกครอง หรือสร้างใหม่ (โดยใช้เบอร์โทรค้นหาเพื่อกันความซ้ำซ้อน)
  let parentFolder = null;
  
  if (parentPhone) {
    // ค้นหาใน Main Folder ว่ามีโฟลเดอร์ย่อยไหนที่มี "เบอร์โทร" นี้อยู่ในชื่อไหม
    const searchIter = mainFolder.searchFolders(`title contains '${parentPhone}'`);
    if (searchIter.hasNext()) {
      parentFolder = searchIter.next();
      
      // ถ้าชื่อเก่าไม่เหมือนชื่อใหม่เป๊ะๆ (เช่น เปลี่ยนจากมี 'น้อง' เป็น 'ไม่มีน้อง') ให้เปลี่ยนชื่อ
      if (parentFolder.getName() !== parentFolderName) {
        parentFolder.setName(parentFolderName);
      }
    }
  }
  
  // ถ้าหาด้วยเบอร์โทรไม่เจอ หรือไม่มีเบอร์โทร ให้ค้นหาด้วยชื่อโฟลเดอร์เป๊ะๆ
  if (!parentFolder) {
    const parentFolderIter = mainFolder.getFoldersByName(parentFolderName);
    if (parentFolderIter.hasNext()) {
      parentFolder = parentFolderIter.next();
    } else {
      parentFolder = mainFolder.createFolder(parentFolderName);
    }
  }

  // 3. จัดการโฟลเดอร์ย่อย (สลิป, ลายเซ็น, หรือชื่อเด็ก)
  let targetFolder = parentFolder;
  if (subFolderName) {
    const subFolderIter = parentFolder.getFoldersByName(subFolderName);
    if (subFolderIter.hasNext()) {
      targetFolder = subFolderIter.next();
    } else {
      targetFolder = parentFolder.createFolder(subFolderName);
    }
  }
  
  // 4. บันทึกไฟล์
  const blob = Utilities.newBlob(Utilities.base64Decode(base64Data), mimeType, fileName);
  const newFile = targetFolder.createFile(blob);
  
  // เปิดให้ทุกคนที่มีลิ้งค์เข้าดูได้ (สำหรับนำลิ้งค์ไปโชว์ในระบบ Admin)
  newFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  
  return newFile.getUrl();
}

// -----------------------------------------------------
// OPTIONS Request (จำเป็นมากสำหรับ Webhook ข้าม Domain CORS)
// -----------------------------------------------------
function doOptions(e) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
  return ContentService.createTextOutput("").setMimeType(ContentService.MimeType.TEXT);
}
