import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * API endpoint to receive a base64‑encoded image, upload it to Catbox (or any image host),
 * and return the public URL. This endpoint is used by the product image upload flow
 * in `ProdutosView.tsx` when a product image is a data URL that cannot be safely
 * passed via a query string.
 */
export const config = {
  api: {
    bodyParser: true,
    externalResolver: true,
  },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { image } = req.body as { image?: string };
  if (!image || typeof image !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid image payload' });
  }

  try {
    // Strip the data URL prefix if present
    const base64 = image.replace(/^data:image\/[a-z]+;base64,/, '');
    const buffer = Buffer.from(base64, 'base64');

    const formData = new FormData();
    formData.append('reqtype', 'fileupload');
    formData.append('userhash', ''); // anonymous upload
    formData.append('fileToUpload', new Blob([buffer]), 'upload.jpg');

    const uploadRes = await fetch('https://catbox.moe/userapi.php', {
      method: 'POST',
      body: formData,
    });

    if (!uploadRes.ok) {
      console.error('Catbox upload failed', uploadRes.status);
      return res.status(502).json({ error: 'Failed to upload image' });
    }

    const url = await uploadRes.text();
    // Catbox returns the URL as plain text
    if (url && url.startsWith('http')) {
      return res.status(200).json({ url: url.trim() });
    }
    console.error('Unexpected Catbox response', url);
    return res.status(502).json({ error: 'Invalid response from image host' });
  } catch (err) {
    console.error('Image upload error', err);
    return res.status(500).json({ error: 'Server error while uploading image' });
  }
}
