// =============================================
// API Route: POST /api/verify-otp
// Xác thực mã OTP và cho phép đặt lại mật khẩu
// =============================================

// Sử dụng cùng global OTP store với /api/send-otp
if (!global._otpStore) {
  global._otpStore = new Map();
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, otp } = body;

    if (!email || !otp) {
      return Response.json(
        { error: 'Thiếu email hoặc mã OTP!' },
        { status: 400 }
      );
    }

    const key = email.toLowerCase();
    const record = global._otpStore.get(key);

    if (!record) {
      return Response.json(
        { error: 'Không tìm thấy yêu cầu OTP cho email này. Vui lòng yêu cầu mã mới!' },
        { status: 400 }
      );
    }

    // Kiểm tra hết hạn
    if (Date.now() > record.expiresAt) {
      global._otpStore.delete(key);
      return Response.json(
        { error: 'Mã OTP đã hết hiệu lực! Vui lòng yêu cầu mã mới.' },
        { status: 400 }
      );
    }

    // Giới hạn số lần thử (5 lần)
    record.attempts = (record.attempts || 0) + 1;
    if (record.attempts > 5) {
      global._otpStore.delete(key);
      return Response.json(
        { error: 'Quá nhiều lần thử! Mã OTP đã bị vô hiệu. Vui lòng yêu cầu mã mới.' },
        { status: 429 }
      );
    }

    // Xác thực OTP
    if (record.otp !== otp.toString().trim()) {
      return Response.json(
        { error: `Mã OTP không đúng! Còn ${5 - record.attempts} lần thử.` },
        { status: 400 }
      );
    }

    // OTP hợp lệ — đánh dấu đã xác thực
    record.verified = true;
    record.verifiedAt = Date.now();

    return Response.json({
      success: true,
      message: 'Xác thực thành công! Vui lòng đặt mật khẩu mới.',
    });
  } catch (err) {
    console.error('Verify OTP error:', err);
    return Response.json(
      { error: err.message || 'Lỗi xác thực OTP' },
      { status: 500 }
    );
  }
}
