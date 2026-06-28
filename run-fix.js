const { execSync } = require('child_process');

try {
    console.log("1. Restoring original files to discard partial fixes...");
    // This will revert src directory to the state in git (which has the original uncorrupted mojibake)
    execSync("git checkout -- src", { stdio: 'inherit' });
    
    console.log("\n2. Running the updated fix-thai.js script with full mapping...");
    execSync("node fix-thai.js", { stdio: 'inherit' });
    
    console.log("\nAll done! The text should now be completely fixed.");
} catch (e) {
    console.error("Error occurred:", e.message);
}
