// =============================================
// Email Service - Gmail via Next.js API Route
// =============================================

import { processTemplateData, TEMPLATE_TYPES } from './emailTemplateStore';
import { fetchChiBoList, fetchEmailTemplates } from './apiClient';

// =============================================
// SEND EMAIL qua API Route /api/send-email
// =============================================
export async function sendEmail(templateType, recipientEmail, data = {}) {
  if (!recipientEmail || !recipientEmail.trim()) {
    throw new Error('Người nhận chưa có email!');
  }

  // Retrieve from database API rather than client-side localStorage
  const templates = await fetchEmailTemplates();
  const templateObj = templates[templateType];
  const { subject, body } = processTemplateData(templateObj, data);

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
// GỬI THÔNG BÁO CẬP NHẬT BƯỚC → EMAIL CHI BỘ
// =============================================
export async function sendChiBoStatusNotification(applicant, step, trangThaiLabel, nguoiGui = '', overallStatus = '') {
  // Tìm chi bộ trong danh mục (qua API)
  const chiBoList = await fetchChiBoList();
  const chiBoObj = chiBoList.find((cb) => cb.ten === applicant.chiBoDangBo);

  const emailChiBo = chiBoObj?.email?.trim();
  if (!emailChiBo) {
    // Không có email chi bộ → bỏ qua, không báo lỗi
    return null;
  }

  let templateType = TEMPLATE_TYPES.CAP_NHAT_BUOC;
  if (overallStatus === 'hoan_thanh') {
    templateType = TEMPLATE_TYPES.HOAN_THANH;
  } else if (overallStatus === 'huy_ho_so') {
    templateType = TEMPLATE_TYPES.HUY_HO_SO;
  }

  return sendEmail(templateType, emailChiBo, {
    hoTen: applicant.hoTen,
    cccd: applicant.cccd,
    chiBo: applicant.chiBoDangBo,
    buocHienTai: String(step.soThuTu),
    tenBuoc: step.tenQuyTrinh,
    trangThai: trangThaiLabel,
    tongBuoc: String(applicant.quyTrinh.length),
    nguoiGui,
  });
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

Đây là email test kết nối từ Hệ thống tiếp nhận và xử lý hồ sơ Kết nạp Đảng.

Nếu bạn nhận được email này, cấu hình Gmail đã hoạt động thành công! ✅

Thời gian gửi: ${new Date().toLocaleString('vi-VN')}

Trân trọng,
Hệ thống tiếp nhận và xử lý hồ sơ xin kết nạp Đảng`,
    }),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || 'Test thất bại!');
  }

  return result;
}
