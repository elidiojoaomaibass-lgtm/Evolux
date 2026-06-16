import { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Serverless Upload Handler
 * Receives a base64 image and uploads it anonymously to catbox.moe for permanent hosting.
 * This yields a tiny image URL (around 30 characters) that can be safely put into shortened checkout links.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { image } = req.body;
        if (!image) {
            return res.status(400).json({ error: 'Missing image payload' });
        }

        // Parse base64 string
        if (!image.startsWith('data:')) {
            return res.status(400).json({ error: 'Invalid base64 image format' });
        }

        const base64Data = image.split(',')[1];
        const mimeType = image.split(';')[0].split(':')[1];
        const extension = mimeType.split('/')[1] || 'jpg';
        
        // Convert to binary buffer
        const buffer = Buffer.from(base64Data, 'base64');

        // Create Blob object
        const blob = new Blob([buffer], { type: mimeType });

        // Build multipart/form-data request
        const formData = new FormData();
        formData.append('reqtype', 'fileupload');
        formData.append('fileToUpload', blob, `product.${extension}`);

        // Upload to catbox.moe (free permanent file sharing API)
        const response = await fetch('https://catbox.moe/user/api.php', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Catbox API error: ${errorText}`);
        }

        const fileUrl = await response.text();
        
        return res.status(200).json({ 
            success: true, 
            url: fileUrl.trim() 
        });

    } catch (error: any) {
        console.error('Serverless Upload Error:', error.message);
        return res.status(500).json({ 
            success: false, 
            error: error.message || 'Internal Server Error' 
        });
    }
}
