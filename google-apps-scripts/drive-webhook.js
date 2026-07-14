// ==========================================
// ICSN PANDA PLAYGROUP - GOOGLE APPS SCRIPT (DRIVE)
// ==========================================
// คำแนะนำ: นำโค้ดนี้ไปวางใน Apps Script ของ Google Drive
// (สร้าง Project ใหม่ > เมนู Extensions > Apps Script)
// 1. รันฟังก์ชัน authorizeAndTestDrive ก่อน เพื่ออนุญาตสิทธิ์
// 2. เซฟ และกด Deploy > New Deployment
// ให้สิทธิ์ Web app รันในฐานะ "Me" และเข้าถึงได้ "Anyone"

const MAIN_FOLDER_NAME = "ICSN Panda Playgroup Files and Pay Slip";

function authorizeAndTestDrive() {
  const folders = DriveApp.getFoldersByName(MAIN_FOLDER_NAME);
  Logger.log("Drive access OK. Found root folder: " + folders.hasNext());
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    if (data.action === 'sync_file') {
      const driveResult = handleFileSync(data);
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        message: "File synced to Drive",
        url: driveResult.fileUrl,
        folderUrl: driveResult.folderUrl
      })).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: "Invalid action"
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function handleFileSync(data) {
  const parentPhone = data.parentPhone;
  const expectedParentFolderName = data.expectedParentFolderName; // e.g. "ธัญญทิพย์ ทรงวศิน (บิว, นุ่น) - 0800000000" or similar? The spec says search by phone.
  // Wait, let's just make the parent folder name include the phone to make it unique and searchable easily, or search by phone in title.
  // The spec says: Main Folder = parents.name (ชื่อเล่นเด็กทุกคน) and ค้นหาด้วย: parents.phone (unique)
  // To ensure we find it by phone, it's best if the phone is IN the folder name, e.g. "Name (Nicknames) [Phone]"
  // Or we search the description?
  
  const parentFolderName = data.parentFolderName; // Should include the name and nicknames
  const childFolderName = data.childFolderName; // May be null for parent photos / slips
  const fileName = data.fileName;
  const mimeType = data.mimeType;
  const base64Data = data.base64Data;
  const fileType = data.fileType; // 'parent_photo', 'child_photo', 'slip', 'signature'

  if (!base64Data) {
    throw new Error("No base64 data provided");
  }

  // 1. หาหรือสร้าง Root Folder "ICSN Panda Playgroup Files and Pay Slip"
  const folders = DriveApp.getFoldersByName(MAIN_FOLDER_NAME);
  let mainFolder;
  if (folders.hasNext()) {
    mainFolder = folders.next();
  } else {
    mainFolder = DriveApp.createFolder(MAIN_FOLDER_NAME);
  }

  // 2. จัดการโฟลเดอร์ผู้ปกครอง (Parent Folder) ค้นหาด้วยเบอร์โทร
  // We append the phone number to the folder name to make it easily searchable and unique.
  // e.g. "ธัญญทิพย์ ทรงวศิน (บิว, นุ่น) - 0841639897"
  const expectedFolderNameWithPhone = parentFolderName + " - " + parentPhone;
  
  const parentFolderIter = mainFolder.searchFolders("title contains '" + parentPhone + "'");
  let parentFolder;
  if (parentFolderIter.hasNext()) {
    parentFolder = parentFolderIter.next();
    // Rename if the name has changed (e.g. added a new child)
    if (parentFolder.getName() !== expectedFolderNameWithPhone) {
      parentFolder.setName(expectedFolderNameWithPhone);
    }
  } else {
    parentFolder = mainFolder.createFolder(expectedFolderNameWithPhone);
  }

  // 3. หา Target Folder (Main Folder หรือ Child Subfolder)
  let targetFolder = parentFolder;
  if (childFolderName) { // e.g. "ภาคิน ทรงวศิน (บิว)"
    const subFolderIter = parentFolder.getFoldersByName(childFolderName);
    if (subFolderIter.hasNext()) {
      targetFolder = subFolderIter.next();
    } else {
      targetFolder = parentFolder.createFolder(childFolderName);
    }
  }

  // 4. Overwrite logic & Duplicate Prevention
  // ถ้าเจอไฟล์ชื่อเดิม ให้ใช้ไฟล์เดิมไปเลย ไม่ต้องลบทิ้ง และไม่ต้องอัปโหลดใหม่ (ประหยัดพื้นที่ + ลิงก์เดิมไม่เปลี่ยน)
  const existingFiles = targetFolder.getFilesByName(fileName);
  if (existingFiles.hasNext()) {
    const oldFile = existingFiles.next();
    return {
      fileUrl: oldFile.getUrl(),
      folderUrl: parentFolder.getUrl()
    };
  }

  // 5. แปลงไฟล์และบันทึกลง Drive (ทำเฉพาะเมื่อไม่มีไฟล์เดิม)
  const blob = Utilities.newBlob(Utilities.base64Decode(base64Data), mimeType, fileName);
  const newFile = targetFolder.createFile(blob);
  newFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  return {
    fileUrl: newFile.getUrl(),
    folderUrl: parentFolder.getUrl()
  };
}

function doOptions(e) {
  return ContentService.createTextOutput("").setMimeType(ContentService.MimeType.TEXT);
}
