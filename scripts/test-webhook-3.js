const gasWebhookUrl = "https://script.google.com/macros/s/AKfycbzUZEjdozA_whh9ilkb1hvXznH00cpdDXbHO6aT5KuTb3gl30_wgGBXBVMlqt6TOnHz/exec";
const base64DummyImage = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACklEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==";

async function runTests() {
  const fullPayload = { 
    action: 'sync_file', 
    base64Data: base64DummyImage, 
    mimeType: 'image/png', 
    parentFolderName: "พ่อทดสอบ3 (น้องเทส3) 0877776666",
    parentPhone: "0877776666",
    subFolderName: "",
    fileName: "parent_profile.png"
  };
  const res = await fetch(gasWebhookUrl, { method: 'POST', body: JSON.stringify(fullPayload) });
  const text = await res.text();
  const fs = require('fs');
  fs.writeFileSync('scripts/gas-error.html', text);
  console.log("Wrote HTML to gas-error.html. Status:", res.status);
}
runTests();
