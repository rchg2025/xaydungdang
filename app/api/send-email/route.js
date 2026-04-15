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
      html: message
        .split('\n')
        .map((line) => (line.trim() === '' ? '<br/>' : `<p style="margin:4px 0;line-height:1.6">${line}</p>`))
        .join(''),
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
