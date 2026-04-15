// =============================================
// API Route: POST /api/send-email
// Gửi email qua Gmail SMTP bằng Nodemailer
// =============================================

import nodemailer from 'nodemailer';

export async function POST(request) {
  try {
    const body = await request.json();
    const { to, toName, subject, message } = body;

    // Validate
    if (!to || !subject || !message) {
      return Response.json(
        { error: 'Thiếu thông tin: to, subject, message là bắt buộc' },
        { status: 400 }
      );
    }

    const gmailUser = process.env.GMAIL_USER;
    const gmailPass = process.env.GMAIL_APP_PASSWORD;

    if (!gmailUser || !gmailPass) {
      return Response.json(
        { error: 'Chưa cấu hình GMAIL_USER và GMAIL_APP_PASSWORD trong biến môi trường!' },
        { status: 500 }
      );
    }

    // Create transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: gmailUser,
        pass: gmailPass,
      },
    });

    // Send mail
    const mailOptions = {
      from: `"Hệ Thống Kết Nạp Đảng" <${gmailUser}>`,
      to: to,
      subject: subject,
      text: message,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
        </head>
        <body style="margin: 0; padding: 0; background-color: #f4f6f9; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f6f9; padding: 30px 10px;">
            <tr>
              <td align="center">
                <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
                  <!-- Header -->
                  <tr>
                    <td style="background-color: #b71c1c; text-align: center; padding: 25px 20px; border-bottom: 4px solid #ffca28;">
                      <h2 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">
                        ĐẢNG BỘ PHƯỜNG CHÁNH HƯNG, TP.HỒ CHÍ MINH
                      </h2>
                    </td>
                  </tr>
                  
                  <!-- Body -->
                  <tr>
                    <td style="padding: 30px 40px; color: #333333; font-size: 15px; line-height: 1.6;">
                      ${message.split('\n').map(line => {
                        const trimmed = line.trim();
                        if (trimmed === '') return '<div style="height: 16px;"></div>';
                        if (trimmed.startsWith('- ')) {
                          const parts = trimmed.substring(2).split(':');
                          if (parts.length > 1) {
                            const lbl = parts[0];
                            const val = parts.slice(1).join(':').trim();
                            // Highlight list items with a prominent left border
                            return `<div style="margin: 8px 0; padding: 10px 15px; background-color: #fdfaf9; border-left: 4px solid #b71c1c; border-radius: 0 4px 4px 0;"><strong style="color: #b71c1c;">${lbl}:</strong> <span style="color: #333;">${val}</span></div>`;
                          }
                          return `<div style="margin: 8px 0; padding-left: 10px; border-left: 3px solid #b71c1c;">${trimmed.substring(2)}</div>`;
                        }
                        return `<p style="margin: 0;">${trimmed}</p>`;
                      }).join('')}
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f8f9fa; text-align: center; padding: 20px; border-top: 1px solid #eeeeee; font-size: 13px; color: #777777;">
                      <p style="margin: 0 0 5px 0;">Email này được gửi tự động từ <strong>Hệ thống tiếp nhận và xử lý hồ sơ xin kết nạp Đảng</strong>.</p>
                      <p style="margin: 0;">Vui lòng không phản hồi lại email này.</p>
                    </td>
                  </tr>
                </table>
                <p style="margin-top: 20px; text-align: center; font-size: 12px; color: #aaaaaa;">&copy; ${new Date().getFullYear()} Hệ thống Xây dựng Đảng</p>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    };

    await transporter.sendMail(mailOptions);

    return Response.json({ success: true, message: `Email đã gửi đến ${to}` });
  } catch (err) {
    console.error('Email send error:', err);
    return Response.json(
      { error: err.message || 'Lỗi gửi email không xác định' },
      { status: 500 }
    );
  }
}
