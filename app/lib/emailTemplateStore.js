// =============================================
// Email Template Store (localStorage)
// =============================================

const TEMPLATE_KEY = 'xaydungdang_email_templates';
const EMAILJS_CONFIG_KEY = 'xaydungdang_emailjs_config';

// ---- Template types ----
export const TEMPLATE_TYPES = {
  KET_NAP: 'ket_nap',
  DU_BI: 'du_bi',
  HOAN_THANH: 'hoan_thanh',
  HUY_HO_SO: 'huy_ho_so',
  THONG_BAO: 'thong_bao',
};

export const TEMPLATE_LABELS = {
  ket_nap: '📋 Thông báo Kết nạp',
  du_bi: '⏳ Thông báo Đảng viên Dự bị',
  hoan_thanh: '✅ Thông báo Hoàn thành',
  huy_ho_so: '❌ Thông báo Hủy hồ sơ',
  thong_bao: '📢 Thông báo chung',
};

// ---- Template variables user can use ----
export const TEMPLATE_VARIABLES = [
  { key: '{{hoTen}}', label: 'Họ tên quần chúng' },
  { key: '{{cccd}}', label: 'Số CCCD' },
  { key: '{{chiBo}}', label: 'Chi bộ/Đảng bộ' },
  { key: '{{buocHienTai}}', label: 'Bước hiện tại' },
  { key: '{{tongBuoc}}', label: 'Tổng số bước' },
  { key: '{{ngay}}', label: 'Ngày hiện tại' },
  { key: '{{nguoiGui}}', label: 'Tên người gửi' },
];

// ---- Defaults ----
const DEFAULT_TEMPLATES = {
  ket_nap: {
    subject: 'Thông báo tiến trình Kết nạp Đảng - {{hoTen}}',
    body: `Kính gửi {{hoTen}},

Hệ thống Quản lý Quy trình Kết nạp Đảng xin thông báo:

Hồ sơ của bạn tại {{chiBo}} đang được xử lý.
- Bước hiện tại: {{buocHienTai}}/{{tongBuoc}}

Vui lòng liên hệ Chi bộ/Đảng bộ cơ sở để biết thêm chi tiết.

Trân trọng,
{{nguoiGui}}`,
  },
  du_bi: {
    subject: 'Thông báo Đảng viên Dự bị - {{hoTen}}',
    body: `Kính gửi {{hoTen}},

Chúc mừng bạn đã được công nhận là Đảng viên Dự bị tại {{chiBo}}.

Bạn cần tiếp tục phấn đấu, rèn luyện trong thời gian dự bị 12 tháng.

Trân trọng,
{{nguoiGui}}`,
  },
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
  thong_bao: {
    subject: 'Thông báo từ Hệ thống Kết nạp Đảng',
    body: `Kính gửi {{hoTen}},

Đây là thông báo từ Hệ thống Quản lý Quy trình Kết nạp Đảng.

Trân trọng,
{{nguoiGui}}`,
  },
};

// =============================================
// TEMPLATE CRUD
// =============================================
function getTemplatesRaw() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(TEMPLATE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function getTemplates() {
  const stored = getTemplatesRaw();
  if (!stored) {
    if (typeof window !== 'undefined') {
      localStorage.setItem(TEMPLATE_KEY, JSON.stringify(DEFAULT_TEMPLATES));
    }
    return { ...DEFAULT_TEMPLATES };
  }
  // Merge with defaults in case new types were added
  return { ...DEFAULT_TEMPLATES, ...stored };
}

export function getTemplate(type) {
  const templates = getTemplates();
  return templates[type] || DEFAULT_TEMPLATES.thong_bao;
}

export function saveTemplate(type, { subject, body }) {
  if (!subject || !subject.trim()) throw new Error('Tiêu đề không được để trống!');
  if (!body || !body.trim()) throw new Error('Nội dung không được để trống!');

  const templates = getTemplates();
  templates[type] = { subject: subject.trim(), body: body.trim() };
  localStorage.setItem(TEMPLATE_KEY, JSON.stringify(templates));
  return templates;
}

export function resetTemplate(type) {
  const templates = getTemplates();
  templates[type] = DEFAULT_TEMPLATES[type] || DEFAULT_TEMPLATES.thong_bao;
  localStorage.setItem(TEMPLATE_KEY, JSON.stringify(templates));
  return templates;
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

// =============================================
// PROCESS TEMPLATE CONTENT
// =============================================
export function processTemplate(templateType, data = {}) {
  const template = getTemplate(templateType);
  const now = new Date();

  const vars = {
    '{{hoTen}}': data.hoTen || 'Nguyễn Văn A',
    '{{cccd}}': data.cccd || '079201001234',
    '{{chiBo}}': data.chiBo || 'Chi bộ ...',
    '{{buocHienTai}}': data.buocHienTai || '1',
    '{{tongBuoc}}': data.tongBuoc || '10',
    '{{ngay}}': now.toLocaleDateString('vi-VN'),
    '{{nguoiGui}}': data.nguoiGui || 'Quản trị viên',
  };

  let subject = template.subject;
  let body = template.body;

  Object.entries(vars).forEach(([key, value]) => {
    subject = subject.replaceAll(key, value);
    body = body.replaceAll(key, value);
  });

  return { subject, body };
}
