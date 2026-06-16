const fs = require('fs');

async function testUpload() {
    const base64Data = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";
    const buffer = Buffer.from(base64Data, 'base64');
    
    const blob = new Blob([buffer], { type: 'image/png' });
    const formData = new FormData();
    formData.append('reqtype', 'fileupload');
    formData.append('fileToUpload', blob, 'product.png');

    const response = await fetch('https://catbox.moe/user/api.php', {
        method: 'POST',
        body: formData
    });

    console.log(response.status);
    console.log(await response.text());
}

testUpload();
