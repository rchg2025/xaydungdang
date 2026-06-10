import { google } from 'googleapis';
import prisma from '../../../../lib/prisma';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    if (!id) return new Response('Missing ID', { status: 400 });

    const configs = await prisma.systemConfig.findMany();
    const configMap = {};
    configs.forEach(c => configMap[c.key] = c.value);

    const { GDRIVE_CLIENT_EMAIL, GDRIVE_PRIVATE_KEY } = configMap;
    if (!GDRIVE_CLIENT_EMAIL || !GDRIVE_PRIVATE_KEY) {
      return new Response('Google Drive chưa được cấu hình', { status: 400 });
    }

    let privateKey = GDRIVE_PRIVATE_KEY;
    let clientEmail = GDRIVE_CLIENT_EMAIL;
    try {
      const parsed = JSON.parse(GDRIVE_PRIVATE_KEY);
      if (parsed.private_key) privateKey = parsed.private_key;
      if (parsed.client_email) clientEmail = parsed.client_email;
    } catch(e) {}
    privateKey = privateKey.replace(/\\n/g, '\n');

    const auth = new google.auth.GoogleAuth({
      credentials: { client_email: clientEmail, private_key: privateKey },
      scopes: ['https://www.googleapis.com/auth/drive.readonly'],
    });

    const drive = google.drive({ version: 'v3', auth });

    // Lấy metadata để biết MimeType
    const meta = await drive.files.get({ fileId: id, fields: 'mimeType, size', supportsAllDrives: true });
    
    // Stream dữ liệu ảnh
    const response = await drive.files.get(
      { fileId: id, alt: 'media', supportsAllDrives: true },
      { responseType: 'stream' }
    );

    // Chuyển luồng từ thư viện googleapis sang Web ReadableStream cho Next.js App Router
    const stream = new ReadableStream({
      start(controller) {
        response.data.on('data', (chunk) => controller.enqueue(chunk));
        response.data.on('end', () => controller.close());
        response.data.on('error', (err) => controller.error(err));
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': meta.data.mimeType || 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000, immutable'
      }
    });
  } catch (err) {
    console.error('Image proxy error:', err);
    return new Response('Lỗi tải ảnh', { status: 500 });
  }
}
