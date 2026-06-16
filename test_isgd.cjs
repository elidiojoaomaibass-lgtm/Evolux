const fs = require('fs');

async function testIsGdPost() {
    const longUrl = `https://google.com/search?q=hello`;
    const formData = new URLSearchParams();
    formData.append('format', 'json');
    formData.append('url', longUrl);

    const response = await fetch('https://is.gd/create.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: formData.toString()
    });

    console.log(response.status);
    console.log(await response.text());
}

testIsGdPost();
