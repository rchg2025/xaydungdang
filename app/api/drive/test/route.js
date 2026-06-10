import { google } from 'googleapis';

export async function POST(request) {
  try {
    const body = await request.json();
    const { GDRIVE_CLIENT_EMAIL, GDRIVE_PRIVATE_KEY, GDRIVE_FOLDER_ID } = body;

    if (!GDRIVE_CLIENT_EMAIL || !GDRIVE_PRIVATE_KEY || !GDRIVE_FOLDER_ID) {
      return Response.json({ error: 'Vui lòng điền đầy đủ Client Email, Private Key và Folder ID' }, { status: 400 });
    }

    // Try to parse private key as JSON first (if user pasted the whole service account json)
    let privateKey = GDRIVE_PRIVATE_KEY;
    let clientEmail = GDRIVE_CLIENT_EMAIL;
    try {
      const parsed = JSON.parse(GDRIVE_PRIVATE_KEY);
      if (parsed.private_key) privateKey = parsed.private_key;
      if (parsed.client_email) clientEmail = parsed.client_email;
    } catch(e) {
      // Not JSON, assume raw string
    }

    // Fix escaped newlines in private key if needed
    privateKey = privateKey.replace(/\\n/g, '\n');

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: clientEmail,
        private_key: privateKey,
      },
      scopes: ['https://www.googleapis.com/auth/drive.file', 'https://www.googleapis.com/auth/drive.readonly'],
    });

    const drive = google.drive({ version: 'v3', auth });

    // Test access by trying to get the folder metadata
    const response = await drive.files.get({
      fileId: GDRIVE_FOLDER_ID,
      fields: 'id, name, mimeType',
      supportsAllDrives: true,
    });

    if (response.data.mimeType !== 'application/vnd.google-apps.folder') {
       return Response.json({ error: 'ID cung cấp không phải là một thư mục (Folder)' }, { status: 400 });
    }

    return Response.json({ success: true, folder: response.data });
  } catch (err) {
    console.error('Drive test error:', err);
    return Response.json({ error: 'Lỗi cấu hình hoặc quyền truy cập: ' + err.message }, { status: 500 });
  }
}
