// =============================================
// API Route: POST /api/reset-password
// Đặt lại mật khẩu sau khi xác thực OTP thành công
// Cập nhật trực tiếp vào localStorage thông qua client
// (Server chỉ xác nhận token hợp lệ)
// =============================================

// Sử dụng cùng global OTP store
if (!global._otpStore) {
  global._otpStore = new Map();
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, otp, newPassword } = body;

    if (!email || !otp || !newPassword) {
      return Response.json(
        { error: 'Thiếu thông tin bắt buộc!' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return Response.json(
        { error: 'Mật khẩu mới phải có ít nhất 6 ký tự!' },
        { status: 400 }
      );
    }

    const key = email.toLowerCase();
    const record = global._otpStore.get(key);

    if (!record) {
      return Response.json(
        { error: 'Phiên xác thực không hợp lệ. Vui lòng bắt đầu lại!' },
        { status: 400 }
      );
    }

    if (!record.verified) {
      return Response.json(
        { error: 'Chưa xác thực OTP. Vui lòng nhập mã OTP trước!' },
        { status: 400 }
      );
    }

    // Kiểm tra thời gian xác thực (tối đa 10 phút sau khi verify)
    if (Date.now() > record.verifiedAt + 10 * 60 * 1000) {
      global._otpStore.delete(key);
      return Response.json(
        { error: 'Phiên xác thực đã hết hạn. Vui lòng bắt đầu lại!' },
        { status: 400 }
      );
    }

    // Kiểm tra OTP khớp lần cuối
    if (record.otp !== otp.toString().trim()) {
      return Response.json(
        { error: 'Token không hợp lệ!' },
        { status: 400 }
      );
    }

    // Xóa OTP record sau khi sử dụng
    global._otpStore.delete(key);

    // Trả về token xác nhận để client cập nhật localStorage
    return Response.json({
      success: true,
      message: 'Xác thực thành công! Mật khẩu sẽ được cập nhật.',
      confirmed: true,
    });
  } catch (err) {
    console.error('Reset password error:', err);
    return Response.json(
      { error: err.message || 'Lỗi đặt lại mật khẩu' },
      { status: 500 }
    );
  }
}
