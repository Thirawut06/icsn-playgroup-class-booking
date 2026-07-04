const gasWebhookUrl = "https://script.google.com/macros/s/AKfycbzUZEjdozA_whh9ilkb1hvXznH00cpdDXbHO6aT5KuTb3gl30_wgGBXBVMlqt6TOnHz/exec";
const base64DummyImage = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACklEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==";

async function runTests() {
  const fullPayload = { 
    action: 'sync_file', 
    base64Data: base64DummyImage, 
    mimeType: 'image/png', 
    parentFolderName: "พ่อทดสอบ4 (น้องเทส4) 0844445555",
    parentPhone: "0844445555",
    subFolderName: "",
    fileName: "parent_profile.png"
  };
  const res = await fetch(gasWebhookUrl, { method: 'POST', body: JSON.stringify(fullPayload) });
  const text = await res.text();
  console.log("Response:", text);
}
runTests();
