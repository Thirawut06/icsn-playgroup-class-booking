// ==========================================
// ICSN PANDA PLAYGROUP - GOOGLE APPS SCRIPT (FINAL VERSION)
// ==========================================
// โค้ดนี้ถูกปรับแต่งให้ทนทาน 100% ต่อปัญหา Permission ของ Google Drive
// โดยใช้ระบบค้นหาจากชื่อแทนการใช้ Folder ID 

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
    
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: "Invalid action" })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ 
      success: false, 
      error: error.toString() 
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function handleFileSync(data) {
  const parentFolderName = data.parentFolderName;
  const subFolderName = data.subFolderName;
  const parentPhone = data.parentPhone;
  const fileName = data.fileName;
  const mimeType = data.mimeType;
  const base64Data = data.base64Data;
  
  if (!base64Data) {
     throw new Error("No base64 data provided");
  }

  // 1. หาหรือสร้างโฟลเดอร์หลัก "ICSN Panda Playgroup Files and Pay Slip"
  const folders = DriveApp.getFoldersByName(MAIN_FOLDER_NAME);
  let mainFolder;
  if (folders.hasNext()) {
    mainFolder = folders.next();
  } else {
    mainFolder = DriveApp.createFolder(MAIN_FOLDER_NAME);
  }
  
  // 2. จัดการโฟลเดอร์ผู้ปกครอง (Parent Folder)
  const fullParentFolderName = parentPhone ? `${parentFolderName} ${parentPhone}` : parentFolderName;
  const parentFolderIter = mainFolder.getFoldersByName(fullParentFolderName);
  let parentFolder;
  if (parentFolderIter.hasNext()) {
    parentFolder = parentFolderIter.next();
  } else {
    parentFolder = mainFolder.createFolder(fullParentFolderName);
  }
  
  // 3. จัดการโฟลเดอร์ย่อย (ชื่อเด็ก หรือ สลิป)
  let targetFolder = parentFolder;
  if (subFolderName) {
    const subFolderIter = parentFolder.getFoldersByName(subFolderName);
    if (subFolderIter.hasNext()) {
      targetFolder = subFolderIter.next();
    } else {
      targetFolder = parentFolder.createFolder(subFolderName);
    }
  }
  
  // 4. แปลงไฟล์และบันทึกลง Drive
  const blob = Utilities.newBlob(Utilities.base64Decode(base64Data), mimeType, fileName);
  const newFile = targetFolder.createFile(blob);
  
  return newFile.getUrl();
}
