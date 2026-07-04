// ==========================================
// ICSN PANDA PLAYGROUP - GOOGLE APPS SCRIPT
// ==========================================
// คำแนะนำ: นำโค้ดนี้ไปวางใน Google Sheet ของคุณ 
// (เมนู Extensions > Apps Script) แล้วเซฟ และกด Deploy > New Deployment
// ให้สิทธิ์ Web app รันในฐานะ "Me" และเข้าถึงได้ "Anyone"

const MAIN_FOLDER_NAME = "ICSN Playgroup"; // แก้ให้ตรงกับชื่อโฟลเดอร์ปัจจุบันของคุณ

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
  const driveParentFolderId = data.driveParentFolderId;
  
  if (!base64Data) throw new Error("No file data provided");

  // 1. กำหนด Main Folder
  let mainFolder;
  if (driveParentFolderId) {
    // ถ้ามีการส่ง ID มาจาก Supabase ให้ใช้ Folder นั้นเป็น Main Folder เลย
    mainFolder = DriveApp.getFolderById(driveParentFolderId);
  } else {
    // ถ้าไม่มีการส่ง ID มา ให้ค้นหาจากชื่อแทน
    const mainFolderIter = DriveApp.getFoldersByName(MAIN_FOLDER_NAME);
    if (mainFolderIter.hasNext()) {
      mainFolder = mainFolderIter.next();
    } else {
      mainFolder = DriveApp.createFolder(MAIN_FOLDER_NAME);
    }
  }
  
  // 2. ค้นหาโฟลเดอร์ผู้ปกครอง หรือสร้างใหม่ (โดยใช้เบอร์โทรค้นหาเพื่อกันความซ้ำซ้อน)
  let parentFolder = null;
  
  if (parentPhone) {
    // ค้นหาใน Main Folder ว่ามีโฟลเดอร์ย่อยไหนที่มี "เบอร์โทร" นี้อยู่ในชื่อไหม
    const searchIter = mainFolder.searchFolders(`title contains '${parentPhone}'`);
    if (searchIter.hasNext()) {
      parentFolder = searchIter.next();
      
      // ถ้าชื่อเก่าไม่เหมือนชื่อใหม่เป๊ะๆ ให้เปลี่ยนชื่อ
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
