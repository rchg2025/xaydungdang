// =============================================
// HỆ THỐNG QUẢN LÝ QUY TRÌNH KẾT NẠP ĐẢNG
// Constants & Configuration
// =============================================

// Thông tin đăng nhập quản trị
export const ADMIN_CREDENTIALS = {
  username: 'qtv',
  password: 'Dang@2026',
};

// Các trạng thái quy trình
export const STATUSES = {
  CHUA_BAT_DAU: 'chua_bat_dau',
  DA_GUI: 'da_gui',
  DANG_XU_LY: 'dang_xu_ly',
  DA_NHAN_PHAN_HOI: 'da_nhan_phan_hoi',
  HUY_HO_SO: 'huy_ho_so',
};

export const STATUS_LABELS = {
  chua_bat_dau: 'Chưa bắt đầu',
  da_gui: 'Đã gửi',
  dang_xu_ly: 'Đang xử lý',
  da_nhan_phan_hoi: 'Đã xong',
  huy_ho_so: 'Hồ sơ bị từ chối',
};

export const STATUS_COLORS = {
  chua_bat_dau: { bg: '#374151', text: '#9ca3af', border: '#4b5563' },
  da_gui: { bg: '#92400e', text: '#fbbf24', border: '#d97706' },
  dang_xu_ly: { bg: '#1e3a5f', text: '#60a5fa', border: '#3b82f6' },
  da_nhan_phan_hoi: { bg: '#064e3b', text: '#34d399', border: '#10b981' },
  huy_ho_so: { bg: '#7f1d1d', text: '#f87171', border: '#ef4444' },
};

export const STATUS_ICONS = {
  chua_bat_dau: '○',
  da_gui: '◐',
  dang_xu_ly: '◑',
  da_nhan_phan_hoi: '●',
  huy_ho_so: '✕',
};

// 10 bước quy trình kết nạp Đảng
export const DEFAULT_PROCESS_STEPS = [
  { soThuTu: 1, tenQuyTrinh: 'Nộp đơn xin vào Đảng' },
  { soThuTu: 2, tenQuyTrinh: 'Chi bộ xem xét, giới thiệu' },
  { soThuTu: 3, tenQuyTrinh: 'Lớp bồi dưỡng nhận thức về Đảng' },
  { soThuTu: 4, tenQuyTrinh: 'Đảng viên chính thức giới thiệu' },
  { soThuTu: 5, tenQuyTrinh: 'Chi bộ xét, đề nghị kết nạp' },
  { soThuTu: 6, tenQuyTrinh: 'Đảng ủy cơ sở xem xét' },
  { soThuTu: 7, tenQuyTrinh: 'Ban Thường vụ Đảng ủy cấp trên xét duyệt' },
  { soThuTu: 8, tenQuyTrinh: 'Tổ chức Lễ kết nạp' },
  { soThuTu: 9, tenQuyTrinh: 'Đảng viên dự bị (12 tháng)' },
  { soThuTu: 10, tenQuyTrinh: 'Công nhận Đảng viên chính thức' },
];

// Danh sách Chi bộ/Đảng bộ mẫu
export const CHI_BO_LIST = [
  'Chi bộ Trường THPT Nguyễn Trãi',
  'Chi bộ Trường THCS Lê Lợi',
  'Chi bộ Phường Tân Định',
  'Chi bộ Xã Bình An',
  'Đảng bộ Quận 1',
  'Đảng bộ Huyện Bình Chánh',
  'Chi bộ Công ty CP Xây dựng Miền Nam',
  'Chi bộ Bệnh viện Đa khoa Trung ương',
];
