// =============================================
// Email Template Store (localStorage)
// =============================================

const TEMPLATE_KEY = 'xaydungdang_email_templates';
const EMAILJS_CONFIG_KEY = 'xaydungdang_emailjs_config';

export const TEMPLATE_TYPES = {
  HOAN_THANH: 'hoan_thanh',
  HUY_HO_SO: 'huy_ho_so',
  CAP_NHAT_BUOC: 'cap_nhat_buoc',
};

export const TEMPLATE_LABELS = {
  hoan_thanh: '✅ Thông báo Hoàn thành',
  huy_ho_so: '❌ Thông báo Hủy hồ sơ',
  cap_nhat_buoc: '🔔 Cập nhật Bước → Chi bộ',
};

// ---- Template variables user can use ----
export const TEMPLATE_VARIABLES = [
  { key: '{{hoTen}}', label: 'Họ tên quần chúng' },
  { key: '{{cccd}}', label: 'Số CCCD' },
  { key: '{{chiBo}}', label: 'Chi bộ/Đảng bộ' },
  { key: '{{buocHienTai}}', label: 'Số bước hiện tại' },
  { key: '{{tenBuoc}}', label: 'Tên bước quy trình' },
  { key: '{{trangThai}}', label: 'Trạng thái bước' },
  { key: '{{tongBuoc}}', label: 'Tổng số bước' },
  { key: '{{ngay}}', label: 'Ngày hiện tại' },
  { key: '{{nguoiGui}}', label: 'Tên người gửi' },
];

// ---- Defaults ----
const DEFAULT_TEMPLATES = {
  hoan_thanh: {
    subject: 'Chúc mừng hoàn thành quy trình - {{hoTen}}',
    body: `Kính gửi {{hoTen}},

Chúc mừng bạn đã hoàn thành toàn bộ quy trình kết nạp Đảng tại {{chiBo}}.

Trân trọng,
{{nguoiGui}}`,
  },
  huy_ho_so: {
    subject: 'Thông báo Hủy hồ sơ - {{hoTen}}',
    body: `Kính gửi {{hoTen}},

Hồ sơ kết nạp Đảng của bạn tại {{chiBo}} đã bị hủy.

Vui lòng liên hệ Chi bộ/Đảng bộ cơ sở để biết thêm chi tiết.

Trân trọng,
{{nguoiGui}}`,
  },
  cap_nhat_buoc: {
    subject: '[Cập nhật Hồ sơ] {{hoTen}} - Bước {{buocHienTai}}: {{tenBuoc}}',
    body: `Kính gửi {{chiBo}},

Hệ thống Tiếp nhận và Xử lý hồ sơ Kết nạp Đảng xin thông báo:

Hồ sơ quần chúng vừa được cập nhật trạng thái:

- Họ tên: {{hoTen}}
- Số CCCD: {{cccd}}
- Chi bộ/Đảng bộ: {{chiBo}}
- Bước đang xử lý: Bước {{buocHienTai}}/{{tongBuoc}} — {{tenBuoc}}
- Trạng thái: {{trangThai}}
- Ngày cập nhật: {{ngay}}
- Người cập nhật: {{nguoiGui}}

Vui lòng kiểm tra hệ thống để biết thêm chi tiết.

Trân trọng,
Hệ thống Tiếp nhận và Xử lý hồ sơ Kết nạp Đảng`,
  },
};

// =============================================
// TEMPLATE CRUD
// =============================================
export function getTemplate(type) {
  // Use DEFAULT_TEMPLATES as fallback if we wanted, but not really needed here since UI loads from API now.
  return DEFAULT_TEMPLATES[type] || DEFAULT_TEMPLATES.hoan_thanh;
}

// =============================================
// EMAILJS CONFIG
// =============================================
export function getEmailJSConfig() {
  if (typeof window === 'undefined') return { serviceId: '', templateId: '', publicKey: '' };
  try {
    const raw = localStorage.getItem(EMAILJS_CONFIG_KEY);
    return raw ? JSON.parse(raw) : { serviceId: '', templateId: '', publicKey: '' };
  } catch {
    return { serviceId: '', templateId: '', publicKey: '' };
  }
}

export function saveEmailJSConfig(config) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(EMAILJS_CONFIG_KEY, JSON.stringify(config));
}

export function processTemplate(templateType, data = {}) {
  const template = getTemplate(templateType);
  return processTemplateData(template, data);
}

export function processTemplateData(template, data = {}) {
  const now = new Date();

  const vars = {
    '{{hoTen}}': data.hoTen || 'Nguyễn Văn A',
    '{{cccd}}': data.cccd || '079201001234',
    '{{chiBo}}': data.chiBo || 'Chi bộ ...',
    '{{buocHienTai}}': data.buocHienTai || '1',
    '{{tenBuoc}}': data.tenBuoc || 'Nộp đơn xin vào Đảng',
    '{{trangThai}}': data.trangThai || 'Đang xử lý',
    '{{tongBuoc}}': data.tongBuoc || '10',
    '{{ngay}}': now.toLocaleDateString('vi-VN'),
    '{{nguoiGui}}': data.nguoiGui || 'Quản trị viên',
  };

  let subject = template.subject || '';
  let body = template.body || '';

  Object.entries(vars).forEach(([key, value]) => {
    subject = subject.replaceAll(key, value);
    body = body.replaceAll(key, value);
  });

  return { subject, body };
}
