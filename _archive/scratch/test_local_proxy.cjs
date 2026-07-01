const fs = require('fs');
const path = require('path');

async function testLocalProxy() {
    try {
        const filePath = path.join(__dirname, 'test.txt');
        fs.writeFileSync(filePath, 'Hello Local Proxy ' + Date.now());
        
        const fileBuffer = fs.readFileSync(filePath);
        const blob = new globalThis.Blob([fileBuffer], { type: 'text/plain' });
        
        const formData = new globalThis.FormData();
        formData.append('reqtype', 'fileupload');
        formData.append('fileToUpload', blob, 'test.txt');
        
        console.log('Sending request to local proxy /api/catbox...');
        const response = await fetch('http://localhost:5173/api/catbox', {
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

testLocalProxy();
