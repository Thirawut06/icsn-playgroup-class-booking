const fs = require('fs');
const path = require('path');

// Complete Windows-874 (CP874) mapping to Unicode
const win874 = new Array(256);
for (let i = 0; i < 256; i++) {
    win874[i] = i; // Default for 0x00-0x7F and potentially others
}

// Windows-1252 / Windows-874 0x80-0x9F range
const cp874_80_9F = {
    0x80: 0x20AC, 0x81: 0x0081, 0x82: 0x201A, 0x83: 0x0192, 0x84: 0x201E, 0x85: 0x2026, 0x86: 0x2020, 0x87: 0x2021, 
    0x88: 0x02C6, 0x89: 0x2030, 0x8A: 0x0160, 0x8B: 0x2039, 0x8C: 0x0152, 0x8D: 0x008D, 0x8E: 0x008E, 0x8F: 0x008F,
    0x90: 0x0090, 0x91: 0x2018, 0x92: 0x2019, 0x93: 0x201C, 0x94: 0x201D, 0x95: 0x2022, 0x96: 0x2013, 0x97: 0x2014,
    0x98: 0x02DC, 0x99: 0x2122, 0x9A: 0x0161, 0x9B: 0x203A, 0x9C: 0x0153, 0x9D: 0x009D, 0x9E: 0x009E, 0x9F: 0x0178
};

for (const [k, v] of Object.entries(cp874_80_9F)) {
    win874[parseInt(k)] = v;
}

// Thai characters 0xA0-0xFF
const thai_A0_FF = {
    0xA0: 0x00A0, 0xA1: 0x0E01, 0xA2: 0x0E02, 0xA3: 0x0E03, 0xA4: 0x0E04, 0xA5: 0x0E05, 0xA6: 0x0E06, 0xA7: 0x0E07,
    0xA8: 0x0E08, 0xA9: 0x0E09, 0xAA: 0x0E0A, 0xAB: 0x0E0B, 0xAC: 0x0E0C, 0xAD: 0x0E0D, 0xAE: 0x0E0E, 0xAF: 0x0E0F,
    0xB0: 0x0E10, 0xB1: 0x0E11, 0xB2: 0x0E12, 0xB3: 0x0E13, 0xB4: 0x0E14, 0xB5: 0x0E15, 0xB6: 0x0E16, 0xB7: 0x0E17,
    0xB8: 0x0E18, 0xB9: 0x0E19, 0xBA: 0x0E1A, 0xBB: 0x0E1B, 0xBC: 0x0E1C, 0xBD: 0x0E1D, 0xBE: 0x0E1E, 0xBF: 0x0E1F,
    0xC0: 0x0E20, 0xC1: 0x0E21, 0xC2: 0x0E22, 0xC3: 0x0E23, 0xC4: 0x0E24, 0xC5: 0x0E25, 0xC6: 0x0E26, 0xC7: 0x0E27,
    0xC8: 0x0E28, 0xC9: 0x0E29, 0xCA: 0x0E2A, 0xCB: 0x0E2B, 0xCC: 0x0E2C, 0xCD: 0x0E2D, 0xCE: 0x0E2E, 0xCF: 0x0E2F,
    0xD0: 0x0E30, 0xD1: 0x0E31, 0xD2: 0x0E32, 0xD3: 0x0E33, 0xD4: 0x0E34, 0xD5: 0x0E35, 0xD6: 0x0E36, 0xD7: 0x0E37,
    0xD8: 0x0E38, 0xD9: 0x0E39, 0xDA: 0x0E3A, 0xDB: 0x00DB, 0xDC: 0x00DC, 0xDD: 0x00DD, 0xDE: 0x00DE, 0xDF: 0x0E3F,
    0xE0: 0x0E40, 0xE1: 0x0E41, 0xE2: 0x0E42, 0xE3: 0x0E43, 0xE4: 0x0E44, 0xE5: 0x0E45, 0xE6: 0x0E46, 0xE7: 0x0E47,
    0xE8: 0x0E48, 0xE9: 0x0E49, 0xEA: 0x0E4A, 0xEB: 0x0E4B, 0xEC: 0x0E4C, 0xED: 0x0E4D, 0xEE: 0x0E4E, 0xEF: 0x0E4F,
    0xF0: 0x0E50, 0xF1: 0x0E51, 0xF2: 0x0E52, 0xF3: 0x0E53, 0xF4: 0x0E54, 0xF5: 0x0E55, 0xF6: 0x0E56, 0xF7: 0x0E57,
    0xF8: 0x0E58, 0xF9: 0x0E59, 0xFA: 0x0E5A, 0xFB: 0x0E5B, 0xFC: 0x00FC, 0xFD: 0x00FD, 0xFE: 0x00FE, 0xFF: 0x00FF
};

for (const [k, v] of Object.entries(thai_A0_FF)) {
    win874[parseInt(k)] = v;
}

const unicode_to_win874 = {};
for (let i = 0; i < 256; i++) {
    unicode_to_win874[win874[i]] = i;
}
// Also map U+0081 back to 0x81 etc in case they were preserved
for(let i=128; i<160; i++) {
    unicode_to_win874[i] = i; 
}

function decodeMojibake(content) {
    if (!content.includes('เธ')) return content; // Quick check

    // We replace all matching mojibake patterns.
    // A mojibake pattern in this case is a sequence of characters that map to valid bytes,
    // which then decode to valid UTF-8.
    
    let result = '';
    let i = 0;
    while (i < content.length) {
        let code = content.charCodeAt(i);
        
        // E0 corresponds to 'เ' (0x0E40). UTF-8 Thai starts with E0.
        if (code === 0x0E40) { 
            let buf = [];
            let j = i;
            while (j < content.length) {
                let c = content.charCodeAt(j);
                if (unicode_to_win874[c] !== undefined) {
                    buf.push(unicode_to_win874[c]);
                } else if (c <= 0x7F) {
                    buf.push(c);
                } else {
                    break;
                }
                j++;
            }
            
            // Try to find the longest valid UTF-8 string that contains Thai characters
            let bestDecoded = null;
            let bestLen = 0;
            
            // We want to decode up to where it's valid UTF-8. 
            // We'll work backwards from the end of the buffer
            for (let len = buf.length; len >= 3; len--) {
                try {
                    let attempt = Buffer.from(buf.slice(0, len)).toString('utf8');
                    // Check if there are no replacement characters and it contains Thai
                    if (!attempt.includes('\uFFFD') && /[\u0E00-\u0E7F]/.test(attempt)) {
                        bestDecoded = attempt;
                        bestLen = len;
                        break;
                    }
                } catch (e) {}
            }
            
            if (bestDecoded) {
                result += bestDecoded;
                i += bestLen;
                continue;
            }
        }
        
        result += content[i];
        i++;
    }
    return result;
}

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? 
            walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

console.log("Scanning src directory for mojibake files...");
let count = 0;
walkDir('./src', (filePath) => {
    if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
        let content = fs.readFileSync(filePath, 'utf8');
        if (content.includes('เธ')) {
            let fixed = decodeMojibake(content);
            if (fixed !== content) {
                fs.writeFileSync(filePath, fixed, 'utf8');
                console.log('Fixed:', filePath);
                count++;
            }
        }
    }
});
console.log(`Finished! Fixed ${count} files.`);
