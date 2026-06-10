'use client';
import { useState, useMemo } from 'react';
import { exportApplicantsToXlsx } from '../lib/excelUtils';
import { STATUSES, ROLES } from '../lib/constants';

// Lấy trạng thái tổng thể của hồ sơ
const getApplicantStatus = (a) => {
  const quyTrinh = a.quyTrinh || [];
  const hasHuy = quyTrinh.some(s => s.trangThai === STATUSES.HUY_HO_SO);
  if (hasHuy) return 'huy_ho_so';
  const allDone = quyTrinh.length > 0 && quyTrinh.every(s => s.trangThai === STATUSES.DA_NHAN_PHAN_HOI);
  if (allDone) return 'hoan_thanh';
  const hasDang = quyTrinh.some(s => s.trangThai === STATUSES.DANG_XU_LY);
  if (hasDang) return 'dang_xu_ly';
  const hasGui = quyTrinh.some(s => s.trangThai === STATUSES.DA_GUI);
  if (hasGui) return 'da_gui';
  return 'cho_xu_ly';
};

const STATUS_FILTER_OPTIONS = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'dang_xu_ly', label: '🔄 Đang xử lý' },
  { value: 'da_gui',     label: '📤 Đã gửi'     },
  { value: 'hoan_thanh', label: '✅ Hoàn thành'  },
  { value: 'cho_xu_ly',  label: '⏳ Chờ xử lý'  },
  { value: 'huy_ho_so',  label: '❌ Đã từ chối' },
];

export default function ReportTab({ applicants, chiBoList, currentUser }) {
  const isThanhVien = currentUser?.role === ROLES.THANH_VIEN;
  
  // Bộ lọc
  const [filterChiBo, setFilterChiBo] = useState(isThanhVien ? currentUser.chiBoDangBo : '');
  const [filterStatus, setFilterStatus] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Lọc dữ liệu
  const filteredData = useMemo(() => {
    return applicants.filter(a => {
      // 1. Lọc theo Chi bộ
      if (filterChiBo && a.chiBoDangBo !== filterChiBo) return false;
      
      // 2. Lọc theo Trạng thái
      if (filterStatus) {
        const status = getApplicantStatus(a);
        if (status !== filterStatus) return false;
      }
      
      // 3. Lọc theo Ngày tạo
      if (dateFrom && a.ngayTao < dateFrom) return false;
      if (dateTo && a.ngayTao > dateTo) return false;
      
      // 4. Tìm kiếm từ khóa
      if (searchTerm) {
        const lowerSearch = searchTerm.toLowerCase();
        const matchName = a.hoTen.toLowerCase().includes(lowerSearch);
        const matchCccd = a.cccd.toLowerCase().includes(lowerSearch);
        if (!matchName && !matchCccd) return false;
      }

      return true;
    });
  }, [applicants, filterChiBo, filterStatus, dateFrom, dateTo, searchTerm]);

  // Thống kê dữ liệu đã lọc
  const stats = useMemo(() => {
    const s = {
      tong: filteredData.length,
      dang_xu_ly: 0,
      hoan_thanh: 0,
      tu_choi: 0,
      cho_xu_ly: 0,
    };
    filteredData.forEach(a => {
      const st = getApplicantStatus(a);
      if (st === 'dang_xu_ly' || st === 'da_gui') s.dang_xu_ly++;
      else if (st === 'hoan_thanh') s.hoan_thanh++;
      else if (st === 'huy_ho_so') s.tu_choi++;
      else s.cho_xu_ly++;
    });
    return s;
  }, [filteredData]);

  const handleExport = async () => {
    // Sử dụng hàm đã có sẵn trong excelUtils
    await exportApplicantsToXlsx(filteredData);
  };

  return (
    <div className="tab-pane active" id="pane-report">
      
      {/* 1. Khu vực Thống kê (Cards) */}
      <div className="dashboard-stats" style={{ marginBottom: '20px' }}>
        <div className="stat-card" style={{ background: 'linear-gradient(135deg, var(--color-primary), #0056b3)' }}>
          <div className="stat-value" style={{ color: 'white' }}>{stats.tong}</div>
          <div className="stat-label" style={{ color: 'rgba(255,255,255,0.8)' }}>Tổng số hồ sơ</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: '#28a745' }}>{stats.hoan_thanh}</div>
          <div className="stat-label">✅ Hoàn thành</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: '#ffc107' }}>{stats.dang_xu_ly}</div>
          <div className="stat-label">🔄 Đang xử lý</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: '#dc3545' }}>{stats.tu_choi}</div>
          <div className="stat-label">❌ Đã từ chối</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>📈 Báo cáo - Thống kê chi tiết</h2>
          <button className="btn btn-primary" onClick={handleExport}>
            📥 Xuất File Excel
          </button>
        </div>
        <div className="card-body">
          
          {/* 2. Bộ lọc thông minh */}
          <div className="filter-bar" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px', padding: '15px', background: 'var(--color-bg-secondary)', borderRadius: '8px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Tìm kiếm</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Tên, CCCD..." 
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)} 
              />
            </div>

            {!isThanhVien && (
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Chi bộ / Đảng bộ</label>
                <select 
                  className="form-input" 
                  value={filterChiBo} 
                  onChange={e => setFilterChiBo(e.target.value)}
                >
                  <option value="">Tất cả đơn vị</option>
                  {chiBoList.map(cb => (
                    <option key={cb.id} value={cb.tenChiBo}>{cb.tenChiBo}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Tình trạng hồ sơ</label>
              <select 
                className="form-input" 
                value={filterStatus} 
                onChange={e => setFilterStatus(e.target.value)}
              >
                {STATUS_FILTER_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Từ ngày</label>
              <input 
                type="date" 
                className="form-input" 
                value={dateFrom} 
                onChange={e => setDateFrom(e.target.value)} 
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Đến ngày</label>
              <input 
                type="date" 
                className="form-input" 
                value={dateTo} 
                onChange={e => setDateTo(e.target.value)} 
              />
            </div>
          </div>

          {/* 3. Danh sách kết quả */}
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>STT</th>
                  <th>Họ và Tên</th>
                  <th>CCCD</th>
                  <th>Chi bộ / Đảng bộ</th>
                  <th>Ngày nộp</th>
                  <th>Tình trạng</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '20px', color: 'var(--color-text-muted)' }}>
                      Không có dữ liệu phù hợp với bộ lọc.
                    </td>
                  </tr>
                ) : (
                  filteredData.map((a, i) => {
                    const st = getApplicantStatus(a);
                    return (
                      <tr key={a.id}>
                        <td>{i + 1}</td>
                        <td style={{ fontWeight: '600' }}>{a.hoTen}</td>
                        <td><code>{a.cccd}</code></td>
                        <td style={{ fontSize: '13px' }}>{a.chiBoDangBo}</td>
                        <td>{a.ngayTao}</td>
                        <td>
                          {st === 'hoan_thanh' && <span className="status-badge status-done">Hoàn thành</span>}
                          {(st === 'dang_xu_ly' || st === 'da_gui') && <span className="status-badge status-processing">Đang xử lý</span>}
                          {st === 'huy_ho_so' && <span className="status-badge status-rejected">Bị từ chối</span>}
                          {st === 'cho_xu_ly' && <span className="status-badge status-pending">Chờ xử lý</span>}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          
          <div style={{ marginTop: '10px', fontSize: '13px', color: 'var(--color-text-muted)' }}>
            Hiển thị <strong>{filteredData.length}</strong> hồ sơ.
          </div>

        </div>
      </div>
    </div>
  );
}
