// =============================================
// API Route: POST /api/send-otp
// Tạo và gửi mã OTP 6 số qua Gmail SMTP
// OTP được lưu server-side với TTL 5 phút
// =============================================

import nodemailer from 'nodemailer';

// In-memory store cho OTP (tồn tại trong Node.js process)
// Key: email, Value: { otp, expiresAt, attempts }
if (!global._otpStore) {
  global._otpStore = new Map();
}

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || !email.includes('@')) {
      return Response.json(
        { error: 'Địa chỉ email không hợp lệ!' },
        { status: 400 }
      );
    }

    const gmailUser = process.env.GMAIL_USER;
    const gmailPass = process.env.GMAIL_APP_PASSWORD;

    if (!gmailUser || !gmailPass || gmailUser === 'your-email@gmail.com') {
      return Response.json(
        { error: 'Chưa cấu hình email server. Vui lòng liên hệ quản trị viên hệ thống!' },
        { status: 500 }
      );
    }

    // Rate limit: Không gửi quá 1 OTP mỗi 60 giây cho cùng email
    const existing = global._otpStore.get(email.toLowerCase());
    if (existing && Date.now() < existing.expiresAt - 4 * 60 * 1000) {
      return Response.json(
        { error: 'Vui lòng chờ ít nhất 60 giây trước khi yêu cầu mã mới!' },
        { status: 429 }
      );
    }

    const otp = generateOTP();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 phút

    // Lưu OTP
    global._otpStore.set(email.toLowerCase(), {
      otp,
      expiresAt,
      attempts: 0,
    });

    // Gửi email
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: gmailUser,
        pass: gmailPass,
      },
    });

    const htmlContent = `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
</head>
<body style="margin:0;padding:0;background:#f4f6fb;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6fb;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#c0392b 0%,#8e0000 100%);padding:36px 40px;text-align:center;">
              <div style="font-size:36px;margin-bottom:8px;">⭐</div>
              <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;letter-spacing:1px;">HỆ THỐNG XÂY DỰNG ĐẢNG</h1>
              <p style="margin:4px 0 0;color:rgba(255,255,255,0.8);font-size:13px;">Đảng bộ Phường Chánh Hưng, TP.HCM</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 32px;">
              <h2 style="margin:0 0 8px;color:#1a1a2e;font-size:20px;">Mã xác thực đặt lại mật khẩu</h2>
              <p style="margin:0 0 28px;color:#666;font-size:14px;line-height:1.6;">
                Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản quản trị liên kết với địa chỉ email này.
              </p>

              <!-- OTP Box -->
              <div style="background:linear-gradient(135deg,#fff5f5,#fff);border:2px solid #c0392b;border-radius:12px;padding:28px;text-align:center;margin-bottom:28px;">
                <p style="margin:0 0 8px;color:#c0392b;font-size:12px;font-weight:600;letter-spacing:2px;text-transform:uppercase;">Mã OTP của bạn</p>
                <div style="font-size:48px;font-weight:800;letter-spacing:12px;color:#1a1a2e;font-family:'Courier New',monospace;line-height:1.2;">${otp}</div>
                <p style="margin:12px 0 0;color:#999;font-size:12px;">⏱ Mã có hiệu lực trong <strong>5 phút</strong></p>
              </div>

              <div style="background:#fff8e1;border-left:4px solid #f59e0b;border-radius:4px;padding:14px 16px;margin-bottom:24px;">
                <p style="margin:0;color:#92400e;font-size:13px;line-height:1.5;">
                  ⚠️ <strong>Lưu ý bảo mật:</strong> Không chia sẻ mã này với bất kỳ ai. Nếu bạn không thực hiện yêu cầu này, hãy bỏ qua email này.
                </p>
              </div>

              <p style="margin:0;color:#aaa;font-size:12px;text-align:center;">
                Mã sẽ hết hiệu lực lúc <strong>${new Date(expiresAt).toLocaleTimeString('vi-VN')}</strong>
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f8f9fa;padding:20px 40px;text-align:center;border-top:1px solid #eee;">
              <p style="margin:0;color:#bbb;font-size:11px;">
                © 2025 Xây dựng Đảng — Đảng bộ Phường Chánh Hưng<br/>
                Email này được gửi tự động, vui lòng không trả lời.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    await transporter.sendMail({
      from: `"Hệ Thống Xây Dựng Đảng" <${gmailUser}>`,
      to: email,
      subject: `[XÂY DỰNG ĐẢNG] Mã OTP đặt lại mật khẩu: ${otp}`,
      html: htmlContent,
    });

    return Response.json({
      success: true,
      message: `Mã OTP đã được gửi đến ${email}. Vui lòng kiểm tra hộp thư (kể cả Spam).`,
    });
  } catch (err) {
    console.error('Send OTP error:', err);
    return Response.json(
      { error: err.message || 'Lỗi gửi OTP không xác định' },
      { status: 500 }
    );
  }
}
