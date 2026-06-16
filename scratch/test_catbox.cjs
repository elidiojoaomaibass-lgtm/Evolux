const fs = require('fs');
const path = require('path');

async function testUpload() {
    try {
        const filePath = path.join(__dirname, 'test.txt');
        fs.writeFileSync(filePath, 'Hello Catbox ' + Date.now());
        
        const fileBuffer = fs.readFileSync(filePath);
        const { Blob, FormData } = await import('node-fetch').then(m => m.default || m).catch(() => ({}));
        
        // Wait, Node.js 18+ has global Blob and FormData
        const blob = new globalThis.Blob([fileBuffer], { type: 'text/plain' });
        
        const formData = new globalThis.FormData();
        formData.append('reqtype', 'fileupload');
        formData.append('fileToUpload', blob, 'test.txt');
        
        console.log('Sending request to Catbox...');
        const response = await fetch('https://catbox.moe/user/api.php', {
            method: 'POST',
            body: formData
        });
        
        console.log('Status:', response.status);
        const text = await response.text();
        console.log('Response:', text);
    } catch (err) {
        console.error('Error:', err);
    }
}

testUpload();
