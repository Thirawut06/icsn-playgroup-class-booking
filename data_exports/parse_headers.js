import fs from 'fs';

const html = fs.readFileSync('c:\\icsn-playgroup-class-booking\\Form Responses 1.html', 'utf8');

// The headers are in the first row. We can extract the text from each <td> in the first row.
// Look for `<tr style="height: 30px"><th id="1687370883R0"...`
const rowMatch = html.match(/<th id="[^"]+R0"[\s\S]*?<\/tr>/);
if (rowMatch) {
  const rowHtml = rowMatch[0];
  const tdRegex = /<td[^>]*>(.*?)<\/td>/g;
  let match;
  let index = 1;
  const colLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const getColName = (n) => {
    let name = '';
    while (n > 0) {
      let rem = (n - 1) % 26;
      name = colLetters[rem] + name;
      n = Math.floor((n - 1) / 26);
    }
    return name;
  };

  while ((match = tdRegex.exec(rowHtml)) !== null) {
    console.log(`${index} (${getColName(index)}): ${match[1].replace(/<[^>]+>/g, '')}`);
    index++;
  }
} else {
  console.log("Header row not found");
}
