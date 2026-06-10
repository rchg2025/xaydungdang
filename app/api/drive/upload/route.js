import { google } from 'googleapis';
import { Readable } from 'stream';
import prisma from '../../../lib/prisma';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return Response.json({ error: 'Không tìm thấy file' }, { status: 400 });
    }

    // Lấy cấu hình Drive từ DB
    const configs = await prisma.systemConfig.findMany();
    const configMap = {};
    configs.forEach(c => configMap[c.key] = c.value);

    const { GDRIVE_CLIENT_EMAIL, GDRIVE_PRIVATE_KEY, GDRIVE_FOLDER_ID } = configMap;

    if (!GDRIVE_CLIENT_EMAIL || !GDRIVE_PRIVATE_KEY || !GDRIVE_FOLDER_ID) {
      return Response.json({ error: 'Chưa cấu hình Google Drive trong phần Quản trị' }, { status: 400 });
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
      scopes: ['https://www.googleapis.com/auth/drive.file'],
    });

    const drive = google.drive({ version: 'v3', auth });

    // Chuyển File thành Node Stream
    const buffer = Buffer.from(await file.arrayBuffer());
    const stream = Readable.from(buffer);

    const fileMetadata = {
      name: `avatar-${Date.now()}-${file.name}`,
      parents: [GDRIVE_FOLDER_ID]
    };
    const media = {
      mimeType: file.type,
      body: stream,
    };

    const response = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id',
      supportsAllDrives: true,
    });

    return Response.json({ success: true, fileId: response.data.id });
  } catch (err) {
    console.error('Upload error:', err);
    return Response.json({ error: 'Lỗi tải ảnh lên Drive: ' + err.message }, { status: 500 });
  }
}
