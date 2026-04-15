// =============================================
// Excel Import / Export Utilities (SheetJS)
// =============================================

import * as XLSX from 'xlsx';
import { DEFAULT_PROCESS_STEPS, STATUSES } from './constants';
import { getProcessStepTemplates } from './store';

// ---- Tiêu đề cột xuất file ----
const EXPORT_HEADERS = [
  'STT',
  'Số CCCD',
  'Họ và Tên',
  'Ngày Sinh',
  'Số Điện Thoại',
  'Email',
  'Chi bộ / Đảng bộ',
  'Ngày Tạo Hồ Sơ',
  'Tiến Độ (%)',
  'Bước Hiện Tại',
  'Trạng Thái',
];

// Tiêu đề cột import (người dùng phải tuân theo)
export const IMPORT_TEMPLATE_HEADERS = [
  'Số CCCD',
  'Họ và Tên',
  'Ngày Sinh (YYYY-MM-DD)',
  'Số Điện Thoại',
  'Email',
  'Chi bộ / Đảng bộ',
];

// ---- Lấy trạng thái tổng thể ----
function getOverallStatus(applicant) {
  const hasHuy = applicant.quyTrinh.some((s) => s.trangThai === STATUSES.HUY_HO_SO);
  if (hasHuy) return 'Hủy hồ sơ';
  const allDone = applicant.quyTrinh.every((s) => s.trangThai === STATUSES.DA_NHAN_PHAN_HOI);
  if (allDone) return 'Hoàn thành';
  const hasDang = applicant.quyTrinh.some((s) => s.trangThai === STATUSES.DANG_XU_LY);
  if (hasDang) return 'Đang xử lý';
  return 'Chờ xử lý';
}

// ---- Tính tiến độ ----
function getProgress(applicant) {
  const done = applicant.quyTrinh.filter((s) => s.trangThai === STATUSES.DA_NHAN_PHAN_HOI).length;
  return Math.round((done / applicant.quyTrinh.length) * 100);
}

// ---- Bước hiện tại ----
function getCurrentStepLabel(applicant) {
  const hasHuy = applicant.quyTrinh.some((s) => s.trangThai === STATUSES.HUY_HO_SO);
  if (hasHuy) return 'Hủy';
  let last = 0;
  applicant.quyTrinh.forEach((s) => {
    if (s.trangThai === STATUSES.DA_NHAN_PHAN_HOI) last = s.soThuTu;
  });
  const total = applicant.quyTrinh.length;
  return `${last}/${total}`;
}

// =============================================
// EXPORT
// =============================================
export function exportApplicantsToXlsx(applicants) {
  // --- Sheet 1: Danh sách quần chúng ---
  const rows = applicants.map((a, i) => ({
    STT: i + 1,
    'Số CCCD': a.cccd,
    'Họ và Tên': a.hoTen,
    'Ngày Sinh': a.ngaySinh,
    'Số Điện Thoại': a.soDienThoai || '',
    Email: a.email || '',
    'Chi bộ / Đảng bộ': a.chiBoDangBo,
    'Ngày Tạo Hồ Sơ': a.ngayTao,
    'Tiến Độ (%)': getProgress(a),
    'Bước Hiện Tại': getCurrentStepLabel(a),
    'Trạng Thái': getOverallStatus(a),
  }));

  const ws1 = XLSX.utils.json_to_sheet(rows, { header: EXPORT_HEADERS });

  // Set column widths
  ws1['!cols'] = [
    { wch: 5 },   // STT
    { wch: 15 },  // CCCD
    { wch: 25 },  // Họ tên
    { wch: 14 },  // Ngày sinh
    { wch: 15 },  // SĐT
    { wch: 28 },  // Email
    { wch: 40 },  // Chi bộ
    { wch: 16 },  // Ngày tạo
    { wch: 12 },  // Tiến độ
    { wch: 12 },  // Bước
    { wch: 14 },  // Trạng thái
  ];

  // --- Sheet 2: Chi tiết quy trình ---
  const processRows = [];
  applicants.forEach((a) => {
    a.quyTrinh.forEach((step) => {
      processRows.push({
        'Số CCCD': a.cccd,
        'Họ và Tên': a.hoTen,
        'Chi bộ / Đảng bộ': a.chiBoDangBo,
        'STT Bước': step.soThuTu,
        'Tên Bước': step.tenQuyTrinh,
        'Trạng Thái': step.trangThai,
        'Ngày Cập Nhật': step.ngayCapNhat || '',
        'Ghi Chú': step.ghiChu || '',
      });
    });
  });

  const ws2 = XLSX.utils.json_to_sheet(processRows);
  ws2['!cols'] = [
    { wch: 15 }, { wch: 25 }, { wch: 40 },
    { wch: 8 }, { wch: 55 }, { wch: 20 }, { wch: 14 }, { wch: 30 },
  ];

  // --- Sheet 3: Mẫu nhập liệu ---
  const templateRows = [
    {
      'Số CCCD': '079201001234',
      'Họ và Tên': 'Nguyễn Văn A',
      'Ngày Sinh (YYYY-MM-DD)': '1998-05-15',
      'Số Điện Thoại': '0901234567',
      'Email': 'example@email.com',
      'Chi bộ / Đảng bộ': 'Chi bộ Trường THPT Nguyễn Trãi',
    },
  ];
  const ws3 = XLSX.utils.json_to_sheet(templateRows, { header: IMPORT_TEMPLATE_HEADERS });
  ws3['!cols'] = [
    { wch: 15 }, { wch: 25 }, { wch: 22 }, { wch: 15 }, { wch: 28 }, { wch: 40 },
  ];

  // --- Workbook ---
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws1, 'Danh Sách Quần Chúng');
  XLSX.utils.book_append_sheet(wb, ws2, 'Chi Tiết Quy Trình');
  XLSX.utils.book_append_sheet(wb, ws3, 'Mẫu Nhập Liệu');

  const today = new Date().toISOString().split('T')[0];
  XLSX.writeFile(wb, `DanhSachQuanChung_${today}.xlsx`);
}

// =============================================
// EXPORT TEMPLATE CHỈ (file mẫu trống)
// =============================================
export function exportImportTemplate() {
  const templateRows = [
    {
      'Số CCCD': '',
      'Họ và Tên': '',
      'Ngày Sinh (YYYY-MM-DD)': '',
      'Số Điện Thoại': '',
      'Email': '',
      'Chi bộ / Đảng bộ': '',
    },
  ];
  const ws = XLSX.utils.json_to_sheet(templateRows, { header: IMPORT_TEMPLATE_HEADERS });
  ws['!cols'] = [
    { wch: 15 }, { wch: 25 }, { wch: 22 }, { wch: 15 }, { wch: 28 }, { wch: 40 },
  ];

  // Style header row note
  const note = XLSX.utils.aoa_to_sheet([
    ['LƯU Ý: Điền từ hàng 2 trở đi. Ngày sinh định dạng YYYY-MM-DD (ví dụ: 1998-05-15). CCCD phải là 12 số duy nhất.'],
    IMPORT_TEMPLATE_HEADERS,
  ]);
  note['!cols'] = [{ wch: 20 }, { wch: 30 }, { wch: 25 }, { wch: 18 }, { wch: 30 }, { wch: 45 }];
  note['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 5 } }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, note, 'Mẫu Nhập Liệu');
  XLSX.writeFile(wb, 'MauNhapLieuQuanChung.xlsx');
}

// =============================================
// IMPORT
// =============================================
export function parseXlsxFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });

        // Tìm sheet có dữ liệu (ưu tiên sheet đầu tiên không phải sheet mẫu)
        let sheetName = workbook.SheetNames[0];
        // Nếu có sheet "Danh Sách Quần Chúng" thì ưu tiên
        if (workbook.SheetNames.includes('Danh Sách Quần Chúng')) {
          sheetName = 'Danh Sách Quần Chúng';
        }
        // Nếu là file mẫu nhập liệu, dùng sheet đầu
        if (workbook.SheetNames.includes('Mẫu Nhập Liệu') && workbook.SheetNames.length === 1) {
          sheetName = 'Mẫu Nhập Liệu';
        }

        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (!jsonData || jsonData.length === 0) {
          reject(new Error('File không có dữ liệu!'));
          return;
        }

        // Xác định mapping cột (hỗ trợ cả file export lẫn file mẫu)
        const parsed = [];
        const errors = [];

        jsonData.forEach((row, idx) => {
          // Bỏ qua dòng ghi chú (dòng đầu của mẫu nhập liệu)
          const keys = Object.keys(row);
          if (keys.length === 1 && String(row[keys[0]]).startsWith('LƯU Ý')) return;
          if (String(row[keys[0]]).startsWith('LƯU Ý')) return;

          // Map cột - hỗ trợ nhiều tên cột khác nhau
          const cccd = String(
            row['Số CCCD'] || row['CCCD'] || row['So CCCD'] || ''
          ).trim();
          const hoTen = String(
            row['Họ và Tên'] || row['Ho va Ten'] || row['Họ Tên'] || row['Ho Ten'] || ''
          ).trim();
          const ngaySinh = String(
            row['Ngày Sinh (YYYY-MM-DD)'] || row['Ngày Sinh'] || row['Ngay Sinh'] || ''
          ).trim();
          const soDienThoai = String(
            row['Số Điện Thoại'] || row['So Dien Thoai'] || row['SĐT'] || ''
          ).trim();
          const email = String(row['Email'] || '').trim();
          const chiBoDangBo = String(
            row['Chi bộ / Đảng bộ'] || row['Chi Bo'] || row['Chi bộ'] || ''
          ).trim();

          // Validation
          const rowNum = idx + 2;
          if (!cccd) { errors.push(`Hàng ${rowNum}: Thiếu số CCCD`); return; }
          if (cccd.length !== 12 || !/^\d+$/.test(cccd)) {
            errors.push(`Hàng ${rowNum}: CCCD "${cccd}" không hợp lệ (phải là 12 chữ số)`);
            return;
          }
          if (!hoTen) { errors.push(`Hàng ${rowNum}: Thiếu họ tên`); return; }
          if (!ngaySinh) { errors.push(`Hàng ${rowNum}: Thiếu ngày sinh`); return; }
          if (!chiBoDangBo) { errors.push(`Hàng ${rowNum}: Thiếu chi bộ/đảng bộ`); return; }

          // Kiểm tra trùng trong batch
          if (parsed.some((p) => p.cccd === cccd)) {
            errors.push(`Hàng ${rowNum}: CCCD "${cccd}" bị trùng trong file`);
            return;
          }

          parsed.push({ cccd, hoTen, ngaySinh, soDienThoai, email, chiBoDangBo });
        });

        resolve({ data: parsed, errors });
      } catch (err) {
        reject(new Error('Không thể đọc file Excel: ' + err.message));
      }
    };
    reader.onerror = () => reject(new Error('Lỗi khi đọc file!'));
    reader.readAsArrayBuffer(file);
  });
}
