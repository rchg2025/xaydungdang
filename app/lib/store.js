// =============================================
// Data Store - LocalStorage Management
// =============================================

import { DEFAULT_PROCESS_STEPS, STATUSES, CHI_BO_LIST } from './constants';

const STORAGE_KEY = 'xaydungdang_applicants';
const INIT_KEY = 'xaydungdang_initialized';
const CHI_BO_STORAGE_KEY = 'xaydungdang_chibo_list';
const PROCESS_STEPS_KEY = 'xaydungdang_process_steps';

// ---- Dữ liệu mẫu ----
const SAMPLE_DATA = [
  {
    id: 'a1b2c3d4',
    cccd: '079201001234',
    hoTen: 'Nguyễn Văn An',
    ngaySinh: '1998-05-15',
    soDienThoai: '0901234567',
    email: 'nguyenvanan@email.com',
    chiBoDangBo: 'Chi bộ Trường THPT Nguyễn Trãi',
    ngayTao: '2025-01-15',
    quyTrinh: [
      { soThuTu: 1, tenQuyTrinh: 'Nộp đơn xin vào Đảng', trangThai: 'da_nhan_phan_hoi', ngayCapNhat: '2025-01-20', ghiChu: 'Đã nộp đơn đầy đủ' },
      { soThuTu: 2, tenQuyTrinh: 'Chi bộ xem xét, giới thiệu', trangThai: 'da_nhan_phan_hoi', ngayCapNhat: '2025-02-15', ghiChu: 'Chi bộ đã thông qua' },
      { soThuTu: 3, tenQuyTrinh: 'Lớp bồi dưỡng nhận thức về Đảng', trangThai: 'da_nhan_phan_hoi', ngayCapNhat: '2025-04-20', ghiChu: 'Hoàn thành lớp bồi dưỡng' },
      { soThuTu: 4, tenQuyTrinh: 'Đảng viên chính thức giới thiệu', trangThai: 'dang_xu_ly', ngayCapNhat: '2025-05-10', ghiChu: 'Đang chờ đảng viên giới thiệu' },
      { soThuTu: 5, tenQuyTrinh: 'Chi bộ xét, đề nghị kết nạp', trangThai: 'chua_bat_dau', ngayCapNhat: '', ghiChu: '' },
      { soThuTu: 6, tenQuyTrinh: 'Đảng ủy cơ sở xem xét', trangThai: 'chua_bat_dau', ngayCapNhat: '', ghiChu: '' },
      { soThuTu: 7, tenQuyTrinh: 'Ban Thường vụ Đảng ủy cấp trên xét duyệt', trangThai: 'chua_bat_dau', ngayCapNhat: '', ghiChu: '' },
      { soThuTu: 8, tenQuyTrinh: 'Tổ chức Lễ kết nạp', trangThai: 'chua_bat_dau', ngayCapNhat: '', ghiChu: '' },
      { soThuTu: 9, tenQuyTrinh: 'Đảng viên dự bị (12 tháng)', trangThai: 'chua_bat_dau', ngayCapNhat: '', ghiChu: '' },
      { soThuTu: 10, tenQuyTrinh: 'Công nhận Đảng viên chính thức', trangThai: 'chua_bat_dau', ngayCapNhat: '', ghiChu: '' },
    ],
  },
  {
    id: 'e5f6g7h8',
    cccd: '052302005678',
    hoTen: 'Trần Thị Bích Ngọc',
    ngaySinh: '2000-11-22',
    soDienThoai: '0912345678',
    email: 'tranbichngoc@email.com',
    chiBoDangBo: 'Chi bộ Trường THCS Lê Lợi',
    ngayTao: '2024-09-01',
    quyTrinh: [
      { soThuTu: 1, tenQuyTrinh: 'Nộp đơn xin vào Đảng', trangThai: 'da_nhan_phan_hoi', ngayCapNhat: '2024-09-10', ghiChu: '' },
      { soThuTu: 2, tenQuyTrinh: 'Chi bộ xem xét, giới thiệu', trangThai: 'da_nhan_phan_hoi', ngayCapNhat: '2024-10-15', ghiChu: '' },
      { soThuTu: 3, tenQuyTrinh: 'Lớp bồi dưỡng nhận thức về Đảng', trangThai: 'da_nhan_phan_hoi', ngayCapNhat: '2024-12-20', ghiChu: '' },
      { soThuTu: 4, tenQuyTrinh: 'Đảng viên chính thức giới thiệu', trangThai: 'da_nhan_phan_hoi', ngayCapNhat: '2025-01-15', ghiChu: '' },
      { soThuTu: 5, tenQuyTrinh: 'Chi bộ xét, đề nghị kết nạp', trangThai: 'da_nhan_phan_hoi', ngayCapNhat: '2025-02-20', ghiChu: '' },
      { soThuTu: 6, tenQuyTrinh: 'Đảng ủy cơ sở xem xét', trangThai: 'da_nhan_phan_hoi', ngayCapNhat: '2025-03-10', ghiChu: '' },
      { soThuTu: 7, tenQuyTrinh: 'Ban Thường vụ Đảng ủy cấp trên xét duyệt', trangThai: 'da_gui', ngayCapNhat: '2025-04-01', ghiChu: 'Đã gửi hồ sơ lên cấp trên' },
      { soThuTu: 8, tenQuyTrinh: 'Tổ chức Lễ kết nạp', trangThai: 'chua_bat_dau', ngayCapNhat: '', ghiChu: '' },
      { soThuTu: 9, tenQuyTrinh: 'Đảng viên dự bị (12 tháng)', trangThai: 'chua_bat_dau', ngayCapNhat: '', ghiChu: '' },
      { soThuTu: 10, tenQuyTrinh: 'Công nhận Đảng viên chính thức', trangThai: 'chua_bat_dau', ngayCapNhat: '', ghiChu: '' },
    ],
  },
  {
    id: 'i9j0k1l2',
    cccd: '038199009012',
    hoTen: 'Lê Hoàng Minh',
    ngaySinh: '1995-03-08',
    soDienThoai: '0978123456',
    email: 'lehoangminh@email.com',
    chiBoDangBo: 'Chi bộ Phường Tân Định',
    ngayTao: '2024-06-15',
    quyTrinh: [
      { soThuTu: 1, tenQuyTrinh: 'Nộp đơn xin vào Đảng', trangThai: 'da_nhan_phan_hoi', ngayCapNhat: '2024-06-20', ghiChu: '' },
      { soThuTu: 2, tenQuyTrinh: 'Chi bộ xem xét, giới thiệu', trangThai: 'da_nhan_phan_hoi', ngayCapNhat: '2024-07-25', ghiChu: '' },
      { soThuTu: 3, tenQuyTrinh: 'Lớp bồi dưỡng nhận thức về Đảng', trangThai: 'da_nhan_phan_hoi', ngayCapNhat: '2024-09-30', ghiChu: '' },
      { soThuTu: 4, tenQuyTrinh: 'Đảng viên chính thức giới thiệu', trangThai: 'da_nhan_phan_hoi', ngayCapNhat: '2024-10-20', ghiChu: '' },
      { soThuTu: 5, tenQuyTrinh: 'Chi bộ xét, đề nghị kết nạp', trangThai: 'da_nhan_phan_hoi', ngayCapNhat: '2024-11-15', ghiChu: '' },
      { soThuTu: 6, tenQuyTrinh: 'Đảng ủy cơ sở xem xét', trangThai: 'da_nhan_phan_hoi', ngayCapNhat: '2024-12-10', ghiChu: '' },
      { soThuTu: 7, tenQuyTrinh: 'Ban Thường vụ Đảng ủy cấp trên xét duyệt', trangThai: 'da_nhan_phan_hoi', ngayCapNhat: '2025-01-20', ghiChu: '' },
      { soThuTu: 8, tenQuyTrinh: 'Tổ chức Lễ kết nạp', trangThai: 'da_nhan_phan_hoi', ngayCapNhat: '2025-02-14', ghiChu: 'Lễ kết nạp tổ chức trang trọng' },
      { soThuTu: 9, tenQuyTrinh: 'Đảng viên dự bị (12 tháng)', trangThai: 'dang_xu_ly', ngayCapNhat: '2025-02-15', ghiChu: 'Bắt đầu thời gian dự bị' },
      { soThuTu: 10, tenQuyTrinh: 'Công nhận Đảng viên chính thức', trangThai: 'chua_bat_dau', ngayCapNhat: '', ghiChu: '' },
    ],
  },
  {
    id: 'm3n4o5p6',
    cccd: '064298003456',
    hoTen: 'Phạm Thanh Hương',
    ngaySinh: '1997-07-30',
    soDienThoai: '0367891234',
    email: 'phamthanhhuong@email.com',
    chiBoDangBo: 'Chi bộ Trường THPT Nguyễn Trãi',
    ngayTao: '2025-03-01',
    quyTrinh: [
      { soThuTu: 1, tenQuyTrinh: 'Nộp đơn xin vào Đảng', trangThai: 'da_nhan_phan_hoi', ngayCapNhat: '2025-03-05', ghiChu: '' },
      { soThuTu: 2, tenQuyTrinh: 'Chi bộ xem xét, giới thiệu', trangThai: 'da_gui', ngayCapNhat: '2025-03-20', ghiChu: 'Hồ sơ đã gửi chi bộ' },
      { soThuTu: 3, tenQuyTrinh: 'Lớp bồi dưỡng nhận thức về Đảng', trangThai: 'chua_bat_dau', ngayCapNhat: '', ghiChu: '' },
      { soThuTu: 4, tenQuyTrinh: 'Đảng viên chính thức giới thiệu', trangThai: 'chua_bat_dau', ngayCapNhat: '', ghiChu: '' },
      { soThuTu: 5, tenQuyTrinh: 'Chi bộ xét, đề nghị kết nạp', trangThai: 'chua_bat_dau', ngayCapNhat: '', ghiChu: '' },
      { soThuTu: 6, tenQuyTrinh: 'Đảng ủy cơ sở xem xét', trangThai: 'chua_bat_dau', ngayCapNhat: '', ghiChu: '' },
      { soThuTu: 7, tenQuyTrinh: 'Ban Thường vụ Đảng ủy cấp trên xét duyệt', trangThai: 'chua_bat_dau', ngayCapNhat: '', ghiChu: '' },
      { soThuTu: 8, tenQuyTrinh: 'Tổ chức Lễ kết nạp', trangThai: 'chua_bat_dau', ngayCapNhat: '', ghiChu: '' },
      { soThuTu: 9, tenQuyTrinh: 'Đảng viên dự bị (12 tháng)', trangThai: 'chua_bat_dau', ngayCapNhat: '', ghiChu: '' },
      { soThuTu: 10, tenQuyTrinh: 'Công nhận Đảng viên chính thức', trangThai: 'chua_bat_dau', ngayCapNhat: '', ghiChu: '' },
    ],
  },
  {
    id: 'q7r8s9t0',
    cccd: '001300007890',
    hoTen: 'Võ Đình Khoa',
    ngaySinh: '1999-12-05',
    soDienThoai: '0856789012',
    email: 'vodinhkhoa@email.com',
    chiBoDangBo: 'Chi bộ Xã Bình An',
    ngayTao: '2024-03-10',
    quyTrinh: [
      { soThuTu: 1, tenQuyTrinh: 'Nộp đơn xin vào Đảng', trangThai: 'da_nhan_phan_hoi', ngayCapNhat: '2024-03-15', ghiChu: '' },
      { soThuTu: 2, tenQuyTrinh: 'Chi bộ xem xét, giới thiệu', trangThai: 'da_nhan_phan_hoi', ngayCapNhat: '2024-04-20', ghiChu: '' },
      { soThuTu: 3, tenQuyTrinh: 'Lớp bồi dưỡng nhận thức về Đảng', trangThai: 'huy_ho_so', ngayCapNhat: '2024-06-01', ghiChu: 'Không hoàn thành lớp bồi dưỡng' },
      { soThuTu: 4, tenQuyTrinh: 'Đảng viên chính thức giới thiệu', trangThai: 'chua_bat_dau', ngayCapNhat: '', ghiChu: '' },
      { soThuTu: 5, tenQuyTrinh: 'Chi bộ xét, đề nghị kết nạp', trangThai: 'chua_bat_dau', ngayCapNhat: '', ghiChu: '' },
      { soThuTu: 6, tenQuyTrinh: 'Đảng ủy cơ sở xem xét', trangThai: 'chua_bat_dau', ngayCapNhat: '', ghiChu: '' },
      { soThuTu: 7, tenQuyTrinh: 'Ban Thường vụ Đảng ủy cấp trên xét duyệt', trangThai: 'chua_bat_dau', ngayCapNhat: '', ghiChu: '' },
      { soThuTu: 8, tenQuyTrinh: 'Tổ chức Lễ kết nạp', trangThai: 'chua_bat_dau', ngayCapNhat: '', ghiChu: '' },
      { soThuTu: 9, tenQuyTrinh: 'Đảng viên dự bị (12 tháng)', trangThai: 'chua_bat_dau', ngayCapNhat: '', ghiChu: '' },
      { soThuTu: 10, tenQuyTrinh: 'Công nhận Đảng viên chính thức', trangThai: 'chua_bat_dau', ngayCapNhat: '', ghiChu: '' },
    ],
  },
];

// ---- Khởi tạo dữ liệu ----
export function initializeData() {
  if (typeof window === 'undefined') return;
  const initialized = localStorage.getItem(INIT_KEY);
  if (!initialized) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(SAMPLE_DATA));
    localStorage.setItem(INIT_KEY, 'true');
  }
}

// ---- Lấy tất cả dữ liệu ----
export function getAllApplicants() {
  if (typeof window === 'undefined') return [];
  initializeData();
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

// ---- Lưu tất cả dữ liệu ----
function saveAll(data) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// ---- Tạo ID ngẫu nhiên ----
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 8);
}

// ---- Thêm quần chúng mới ----
export function addApplicant(applicantData) {
  const applicants = getAllApplicants();
  
  // Kiểm tra trùng CCCD
  if (applicants.some(a => a.cccd === applicantData.cccd)) {
    throw new Error('Số CCCD đã tồn tại trong hệ thống!');
  }

  const newApplicant = {
    id: generateId(),
    cccd: applicantData.cccd,
    hoTen: applicantData.hoTen,
    ngaySinh: applicantData.ngaySinh,
    soDienThoai: applicantData.soDienThoai,
    email: applicantData.email,
    chiBoDangBo: applicantData.chiBoDangBo,
    ngayTao: new Date().toISOString().split('T')[0],
    quyTrinh: getProcessStepTemplates().map(step => ({
      soThuTu: step.soThuTu,
      tenQuyTrinh: step.tenQuyTrinh,
      trangThai: STATUSES.CHUA_BAT_DAU,
      ngayCapNhat: '',
      gioCapNhat: '',
      nguoiCapNhat: '',
      ghiChu: '',
    })),
  };

  applicants.push(newApplicant);
  saveAll(applicants);
  return newApplicant;
}

// ---- Cập nhật thông tin quần chúng ----
export function updateApplicant(id, updates) {
  const applicants = getAllApplicants();
  const index = applicants.findIndex(a => a.id === id);
  if (index === -1) throw new Error('Không tìm thấy quần chúng!');

  // Kiểm tra trùng CCCD (trừ chính mình)
  if (updates.cccd && applicants.some(a => a.cccd === updates.cccd && a.id !== id)) {
    throw new Error('Số CCCD đã tồn tại trong hệ thống!');
  }

  applicants[index] = { ...applicants[index], ...updates };
  saveAll(applicants);
  return applicants[index];
}

// ---- Xoá quần chúng ----
export function deleteApplicant(id) {
  const applicants = getAllApplicants();
  const filtered = applicants.filter(a => a.id !== id);
  saveAll(filtered);
}

// ---- Cập nhật trạng thái bước quy trình ----
export function updateProcessStep(applicantId, soThuTu, trangThai, ghiChu = '', nguoiCapNhat = '') {
  const applicants = getAllApplicants();
  const applicant = applicants.find(a => a.id === applicantId);
  if (!applicant) throw new Error('Không tìm thấy quần chúng!');

  const step = applicant.quyTrinh.find(s => s.soThuTu === soThuTu);
  if (!step) throw new Error('Không tìm thấy bước quy trình!');

  const now = new Date();
  step.trangThai = trangThai;
  step.ngayCapNhat = now.toISOString().split('T')[0];
  step.gioCapNhat = now.toLocaleString('vi-VN', {
    hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric'
  });
  step.nguoiCapNhat = nguoiCapNhat || '';
  if (ghiChu) step.ghiChu = ghiChu;

  saveAll(applicants);
  return applicant;
}


// ---- Tìm kiếm theo CCCD ----
export function searchByCCCD(cccd) {
  const applicants = getAllApplicants();
  return applicants.filter(a => a.cccd.includes(cccd));
}

// ---- Tìm kiếm theo Chi bộ/Đảng bộ ----
export function searchByChiBo(keyword) {
  const applicants = getAllApplicants();
  const normalizedKeyword = keyword.toLowerCase().trim();
  return applicants.filter(a =>
    a.chiBoDangBo.toLowerCase().includes(normalizedKeyword)
  );
}

// ---- Tìm kiếm tổng hợp ----
export function searchApplicants(cccd, chiBo) {
  const applicants = getAllApplicants();
  return applicants.filter(a => {
    const matchCCCD = cccd ? a.cccd.includes(cccd.trim()) : true;
    const matchChiBo = chiBo ? a.chiBoDangBo.toLowerCase().includes(chiBo.toLowerCase().trim()) : true;
    return matchCCCD && matchChiBo;
  });
}

// ---- Thống kê ----
export function getStatistics() {
  const applicants = getAllApplicants();
  
  let dangXuLy = 0;
  let daHoanThanh = 0;
  let daHuy = 0;
  let choXuLy = 0;

  applicants.forEach(a => {
    const hasHuy = a.quyTrinh.some(s => s.trangThai === STATUSES.HUY_HO_SO);
    const allDone = a.quyTrinh.every(s => s.trangThai === STATUSES.DA_NHAN_PHAN_HOI);
    const hasDangXuLy = a.quyTrinh.some(s => s.trangThai === STATUSES.DANG_XU_LY);
    
    if (hasHuy) daHuy++;
    else if (allDone) daHoanThanh++;
    else if (hasDangXuLy) dangXuLy++;
    else choXuLy++;
  });

  return {
    tongSo: applicants.length,
    dangXuLy,
    daHoanThanh,
    daHuy,
    choXuLy,
  };
}

// ---- Lấy bước hiện tại của quần chúng ----
export function getCurrentStep(applicant) {
  if (!applicant || !applicant.quyTrinh) return 0;
  
  const hasHuy = applicant.quyTrinh.some(s => s.trangThai === STATUSES.HUY_HO_SO);
  if (hasHuy) return -1; // Hủy hồ sơ

  let lastCompleted = 0;
  for (const step of applicant.quyTrinh) {
    if (step.trangThai === STATUSES.DA_NHAN_PHAN_HOI) {
      lastCompleted = step.soThuTu;
    }
  }
  return lastCompleted;
}

// ---- Reset dữ liệu về mặc định ----
export function resetData() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(INIT_KEY);
  initializeData();
}

// =============================================
// Quản lý Danh mục Chi bộ / Đảng bộ
// =============================================

// ---- Lấy danh sách chi bộ ----
export function getChiBoList() {
  if (typeof window === 'undefined') return CHI_BO_LIST;
  try {
    const data = localStorage.getItem(CHI_BO_STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      // Migration: chuyển dữ liệu cũ (string[]) sang object[]
      if (parsed.length > 0 && typeof parsed[0] === 'string') {
        const migrated = parsed.map((s) => ({
          ten: s, biThu: '', chanhVanPhong: '', soDienThoai: '', email: '',
        }));
        localStorage.setItem(CHI_BO_STORAGE_KEY, JSON.stringify(migrated));
        return migrated;
      }
      return parsed;
    }
    // Khởi tạo lần đầu từ constants
    localStorage.setItem(CHI_BO_STORAGE_KEY, JSON.stringify(CHI_BO_LIST));
    return CHI_BO_LIST;
  } catch {
    return CHI_BO_LIST;
  }
}

// ---- Lưu danh sách chi bộ ----
function saveChiBoList(list) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CHI_BO_STORAGE_KEY, JSON.stringify(list));
}

// ---- Thêm chi bộ mới ----
export function addChiBo({ ten, biThu = '', chanhVanPhong = '', soDienThoai = '', email = '' }) {
  const list = getChiBoList();
  const trimmed = (ten || '').trim();
  if (!trimmed) throw new Error('Tên chi bộ không được để trống!');
  if (list.some((cb) => cb.ten === trimmed)) throw new Error('Chi bộ/Đảng bộ này đã tồn tại!');
  list.push({ ten: trimmed, biThu: biThu.trim(), chanhVanPhong: chanhVanPhong.trim(), soDienThoai: soDienThoai.trim(), email: email.trim() });
  saveChiBoList(list);
  return list;
}

// ---- Cập nhật chi bộ ----
export function updateChiBo(oldName, updates) {
  const list = getChiBoList();
  const newName = (updates.ten || '').trim();
  if (!newName) throw new Error('Tên chi bộ không được để trống!');
  const idx = list.findIndex((cb) => cb.ten === oldName);
  if (idx === -1) throw new Error('Không tìm thấy chi bộ!');
  if (list.some((cb) => cb.ten === newName && cb.ten !== oldName)) throw new Error('Tên chi bộ đã tồn tại!');
  list[idx] = {
    ten: newName,
    biThu: (updates.biThu || '').trim(),
    chanhVanPhong: (updates.chanhVanPhong || '').trim(),
    soDienThoai: (updates.soDienThoai || '').trim(),
    email: (updates.email || '').trim(),
  };
  saveChiBoList(list);

  // Cập nhật tên chi bộ trong tất cả hồ sơ
  const applicants = getAllApplicants();
  applicants.forEach(a => {
    if (a.chiBoDangBo === oldName) a.chiBoDangBo = newName;
  });
  saveAll(applicants);
  return list;
}

// ---- Xóa chi bộ ----
export function deleteChiBo(tenChiBo) {
  const list = getChiBoList();
  const idx = list.findIndex((cb) => cb.ten === tenChiBo);
  if (idx === -1) throw new Error('Không tìm thấy chi bộ!');
  list.splice(idx, 1);
  saveChiBoList(list);
  return list;
}

// =============================================
// Quản lý Danh mục Bước Quy trình Mẫu
// =============================================

// ---- Lấy danh sách bước quy trình mẫu ----
export function getProcessStepTemplates() {
  if (typeof window === 'undefined') return DEFAULT_PROCESS_STEPS;
  try {
    const data = localStorage.getItem(PROCESS_STEPS_KEY);
    if (data) return JSON.parse(data);
    localStorage.setItem(PROCESS_STEPS_KEY, JSON.stringify(DEFAULT_PROCESS_STEPS));
    return DEFAULT_PROCESS_STEPS;
  } catch {
    return DEFAULT_PROCESS_STEPS;
  }
}

// ---- Lưu danh sách bước quy trình mẫu ----
function saveProcessStepTemplates(steps) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(PROCESS_STEPS_KEY, JSON.stringify(steps));
}

// ---- Thêm bước quy trình mẫu ----
export function addProcessStepTemplate(tenQuyTrinh) {
  const steps = getProcessStepTemplates();
  const trimmed = tenQuyTrinh.trim();
  if (!trimmed) throw new Error('Tên bước quy trình không được để trống!');
  const maxSoThuTu = steps.reduce((max, s) => Math.max(max, s.soThuTu), 0);
  const newStep = { soThuTu: maxSoThuTu + 1, tenQuyTrinh: trimmed };
  steps.push(newStep);
  saveProcessStepTemplates(steps);
  syncAllApplicantsWithTemplate();
  return steps;
}

// ---- Cập nhật tên bước quy trình mẫu ----
export function updateProcessStepTemplate(soThuTu, tenQuyTrinh) {
  const steps = getProcessStepTemplates();
  const trimmed = tenQuyTrinh.trim();
  if (!trimmed) throw new Error('Tên bước quy trình không được để trống!');
  const step = steps.find(s => s.soThuTu === soThuTu);
  if (!step) throw new Error('Không tìm thấy bước quy trình!');
  step.tenQuyTrinh = trimmed;
  saveProcessStepTemplates(steps);
  syncAllApplicantsWithTemplate();
  return steps;
}

// ---- Xóa bước quy trình mẫu ----
export function deleteProcessStepTemplate(soThuTu) {
  const steps = getProcessStepTemplates();
  const idx = steps.findIndex(s => s.soThuTu === soThuTu);
  if (idx === -1) throw new Error('Không tìm thấy bước quy trình!');
  steps.splice(idx, 1);
  // Cập nhật lại số thứ tự
  steps.forEach((s, i) => { s.soThuTu = i + 1; });
  saveProcessStepTemplates(steps);
  syncAllApplicantsWithTemplate();
  return steps;
}

// ---- Di chuyển thứ tự bước quy trình mẫu ----
export function moveProcessStepTemplate(soThuTu, direction) {
  const steps = getProcessStepTemplates();
  const idx = steps.findIndex(s => s.soThuTu === soThuTu);
  if (idx === -1) throw new Error('Không tìm thấy bước quy trình!');
  const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
  if (targetIdx < 0 || targetIdx >= steps.length) return steps;
  [steps[idx], steps[targetIdx]] = [steps[targetIdx], steps[idx]];
  steps.forEach((s, i) => { s.soThuTu = i + 1; });
  saveProcessStepTemplates(steps);
  syncAllApplicantsWithTemplate();
  return steps;
}

// ---- Đồng bộ tất cả hồ sơ theo template hiện tại ----
export function syncAllApplicantsWithTemplate() {
  if (typeof window === 'undefined') return;
  const template = getProcessStepTemplates();
  const applicants = getAllApplicants();

  applicants.forEach(a => {
    // Map step cũ theo soThuTu
    const oldMap = {};
    a.quyTrinh.forEach(s => { oldMap[s.soThuTu] = s; });

    // Rebuild quyTrinh theo template mới
    a.quyTrinh = template.map(tmpl => {
      const existing = oldMap[tmpl.soThuTu];
      if (existing) {
        // Giữ nguyên tiến độ, chỉ cập nhật tên bước
        return { ...existing, tenQuyTrinh: tmpl.tenQuyTrinh, soThuTu: tmpl.soThuTu };
      }
      // Bước mới chưa có trong hồ sơ
      return {
        soThuTu: tmpl.soThuTu,
        tenQuyTrinh: tmpl.tenQuyTrinh,
        trangThai: STATUSES.CHUA_BAT_DAU,
        ngayCapNhat: '',
        ghiChu: '',
      };
    });
  });

  saveAll(applicants);
}

// ---- Cập nhật bước quy trình với ghi chú ----
export function updateProcessStepWithNote(applicantId, soThuTu, trangThai, ghiChu = '') {
  const applicants = getAllApplicants();
  const applicant = applicants.find(a => a.id === applicantId);
  if (!applicant) throw new Error('Không tìm thấy quần chúng!');

  const step = applicant.quyTrinh.find(s => s.soThuTu === soThuTu);
  if (!step) throw new Error('Không tìm thấy bước quy trình!');

  step.trangThai = trangThai;
  step.ngayCapNhat = new Date().toISOString().split('T')[0];
  step.ghiChu = ghiChu;

  saveAll(applicants);
  return applicant;
}
