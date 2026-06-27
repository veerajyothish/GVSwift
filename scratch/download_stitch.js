const fs = require('fs');
const path = require('path');
const https = require('https');
const url = require('url');

const outputFilePath = 'C:\\Users\\Jyoth\\.gemini\\antigravity-ide\\brain\\f5d8b071-d542-4de5-b18a-911922be57a8\\.system_generated\\steps\\21\\output.txt';
const targetBaseDir = 'c:\\Users\\Jyoth\\Downloads\\files (5)\\gvswift-final-package\\stitch';

// Create directories if they don't exist
const htmlDir = path.join(targetBaseDir, 'html');
const imgDir = path.join(targetBaseDir, 'screenshots');

if (!fs.existsSync(htmlDir)) fs.mkdirSync(htmlDir, { recursive: true });
if (!fs.existsSync(imgDir)) fs.mkdirSync(imgDir, { recursive: true });

function downloadFile(fileUrl, outputPath) {
  return new Promise((resolve, reject) => {
    function get(currentUrl) {
      https.get(currentUrl, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          // Follow redirect
          const redirectUrl = url.resolve(currentUrl, res.headers.location);
          get(redirectUrl);
        } else if (res.statusCode === 200) {
          const fileStream = fs.createWriteStream(outputPath);
          res.pipe(fileStream);
          fileStream.on('finish', () => {
            fileStream.close();
            resolve();
          });
          fileStream.on('error', (err) => {
            reject(err);
          });
        } else {
          reject(new Error(`Failed to download ${currentUrl}: Status Code ${res.statusCode}`));
        }
      }).on('error', (err) => {
        reject(err);
      });
    }
    get(fileUrl);
  });
}

async function main() {
  try {
    const data = fs.readFileSync(outputFilePath, 'utf8');
    const parsed = JSON.parse(data);
    const screens = parsed.screens;
    console.log(`Found ${screens.length} screens in metadata.`);

    for (let i = 0; i < screens.length; i++) {
      const screen = screens[i];
      const titleSanitized = screen.title.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
      const screenId = screen.name.split('/').pop();
      console.log(`[${i+1}/${screens.length}] Processing screen: ${screen.title} (ID: ${screenId})`);

      // HTML File path
      if (screen.htmlCode && screen.htmlCode.downloadUrl) {
        const htmlPath = path.join(htmlDir, `${titleSanitized}_${screenId}.html`);
        console.log(`  Downloading HTML to ${htmlPath}...`);
        try {
          await downloadFile(screen.htmlCode.downloadUrl, htmlPath);
          console.log(`  HTML downloaded successfully.`);
        } catch (e) {
          console.error(`  Error downloading HTML: ${e.message}`);
        }
      }

      // Screenshot File path
      if (screen.screenshot && screen.screenshot.downloadUrl) {
        const screenshotPath = path.join(imgDir, `${titleSanitized}_${screenId}.png`);
        console.log(`  Downloading Screenshot to ${screenshotPath}...`);
        try {
          await downloadFile(screen.screenshot.downloadUrl, screenshotPath);
          console.log(`  Screenshot downloaded successfully.`);
        } catch (e) {
          console.error(`  Error downloading Screenshot: ${e.message}`);
        }
      }
    }
    console.log('Download process completed.');
  } catch (err) {
    console.error(`Main error: ${err.message}`);
  }
}

main();
