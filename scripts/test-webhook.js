const gasWebhookUrl = "https://script.google.com/macros/s/AKfycbzUZEjdozA_whh9ilkb1hvXznH00cpdDXbHO6aT5KuTb3gl30_wgGBXBVMlqt6TOnHz/exec";
const base64DummyImage = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACklEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==";

async function testWebhook(scenarioName, payload) {
  console.log(`\n--- Running Test: ${scenarioName} ---`);
  const fullPayload = { action: 'sync_file', base64Data: base64DummyImage, mimeType: 'image/png', ...payload };
  const res = await fetch(gasWebhookUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(fullPayload) });
  if (!res.ok) { console.error(`❌ HTTP Error: ${res.status}`); return; }
  const text = await res.text();
  try {
    const data = JSON.parse(text);
    console.log(data.success ? `✅ Success! File URL: ${data.url}` : `❌ GAS Error: ${data.error}`);
  } catch (e) {
    console.error(`❌ Failed to parse JSON. Response:`, text.substring(0, 200));
  }
}

async function runTests() {
  await testWebhook("1. New Parent Photo", {
    parentFolderName: "พ่อทดสอบ2 (น้องเทส2) 0899998888",
    parentPhone: "0899998888",
    subFolderName: "",
    fileName: "parent_profile.png"
  });
}
runTests();
