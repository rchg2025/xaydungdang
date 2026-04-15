// =============================================
// Email Service - EmailJS Integration
// =============================================

import emailjs from '@emailjs/browser';
import { getEmailJSConfig, processTemplate } from './emailTemplateStore';

// =============================================
// SEND EMAIL
// =============================================
export async function sendEmail(templateType, recipientEmail, data = {}) {
  const config = getEmailJSConfig();

  if (!config.serviceId || !config.templateId || !config.publicKey) {
    throw new Error(
      'Chưa cấu hình EmailJS! Vào tab 📧 Email → phần Cấu hình EmailJS để thiết lập.'
    );
  }

  if (!recipientEmail || !recipientEmail.trim()) {
    throw new Error('Người nhận chưa có email!');
  }

  const { subject, body } = processTemplate(templateType, data);

  const templateParams = {
    to_email: recipientEmail.trim(),
    to_name: data.hoTen || '',
    subject: subject,
    message: body,
  };

  try {
    const result = await emailjs.send(
      config.serviceId,
      config.templateId,
      templateParams,
      config.publicKey
    );
    return { success: true, status: result.status, text: result.text };
  } catch (err) {
    throw new Error(
      `Gửi email thất bại: ${err.text || err.message || 'Lỗi không xác định'}`
    );
  }
}

// =============================================
// TEST CONNECTION
// =============================================
export async function testEmailConnection(testEmail) {
  const config = getEmailJSConfig();

  if (!config.serviceId || !config.templateId || !config.publicKey) {
    throw new Error('Chưa cấu hình đầy đủ thông tin EmailJS!');
  }

  const templateParams = {
    to_email: testEmail,
    to_name: 'Test User',
    subject: 'Test kết nối EmailJS - Hệ thống Kết nạp Đảng',
    message: 'Đây là email test kết nối. Nếu bạn nhận được email này, cấu hình EmailJS đã đúng!',
  };

  try {
    const result = await emailjs.send(
      config.serviceId,
      config.templateId,
      templateParams,
      config.publicKey
    );
    return { success: true, status: result.status };
  } catch (err) {
    throw new Error(`Test thất bại: ${err.text || err.message}`);
  }
}
