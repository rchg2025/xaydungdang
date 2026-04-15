// =============================================
// Email Service - Gmail via Next.js API Route
// =============================================

import { processTemplate } from './emailTemplateStore';

// =============================================
// SEND EMAIL qua API Route /api/send-email
// =============================================
export async function sendEmail(templateType, recipientEmail, data = {}) {
  if (!recipientEmail || !recipientEmail.trim()) {
    throw new Error('Người nhận chưa có email!');
  }

  const { subject, body } = processTemplate(templateType, data);

  const response = await fetch('/api/send-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: recipientEmail.trim(),
      toName: data.hoTen || '',
      subject,
      message: body,
    }),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || 'Gửi email thất bại!');
  }

  return result;
}

// =============================================
// TEST - gửi email test đến địa chỉ cho trước
// =============================================
export async function testEmailConnection(testEmail) {
  if (!testEmail || !testEmail.trim()) {
    throw new Error('Vui lòng nhập email test!');
  }

  const response = await fetch('/api/send-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: testEmail.trim(),
      toName: 'Test',
      subject: '✅ Test kết nối Gmail - Hệ thống Kết nạp Đảng',
      message: `Xin chào,

Đây là email test kết nối từ Hệ thống Quản lý Quy trình Kết nạp Đảng.

Nếu bạn nhận được email này, cấu hình Gmail đã hoạt động thành công! ✅

Thời gian gửi: ${new Date().toLocaleString('vi-VN')}

Trân trọng,
Hệ thống Kết nạp Đảng`,
    }),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || 'Test thất bại!');
  }

  return result;
}
