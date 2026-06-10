'use client';
import { useState, useMemo } from 'react';
import { STATUSES } from '../lib/constants';
import { ROLES, getCurrentStep } from '../lib/apiClient';
import { exportApplicantsToXlsx } from '../lib/excelUtils';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';

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
      steps: {}
    };
    filteredData.forEach(a => {
      const st = getApplicantStatus(a);
      if (st === 'dang_xu_ly' || st === 'da_gui') s.dang_xu_ly++;
      else if (st === 'hoan_thanh') s.hoan_thanh++;
      else if (st === 'huy_ho_so') s.tu_choi++;
      else s.cho_xu_ly++;

      const step = getCurrentStep(a);
      if (step > 0 && st !== 'huy_ho_so') {
        s.steps[step] = (s.steps[step] || 0) + 1;
      }
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
      <div className="stats-grid" style={{ marginBottom: '20px' }}>
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'rgba(59,130,246,0.12)', color: '#60a5fa', boxShadow: '0 0 0 1px rgba(59,130,246,0.2)' }}>📁</div>
          <div className="stat-card-body">
            <div className="stat-card-value" style={{ color: '#60a5fa' }}>{stats.tong}</div>
            <div className="stat-card-label">TỔNG SỐ HỒ SƠ</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'rgba(99,102,241,0.12)', color: '#818cf8', boxShadow: '0 0 0 1px rgba(99,102,241,0.2)' }}>🔄</div>
          <div className="stat-card-body">
            <div className="stat-card-value" style={{ color: '#818cf8' }}>{stats.dang_xu_ly}</div>
            <div className="stat-card-label">ĐANG XỬ LÝ</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'rgba(16,185,129,0.12)', color: '#34d399', boxShadow: '0 0 0 1px rgba(16,185,129,0.2)' }}>✅</div>
          <div className="stat-card-body">
            <div className="stat-card-value" style={{ color: '#10b981' }}>{stats.hoan_thanh}</div>
            <div className="stat-card-label">HOÀN THÀNH</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'rgba(245,158,11,0.12)', color: '#fbbf24', boxShadow: '0 0 0 1px rgba(245,158,11,0.2)' }}>⏳</div>
          <div className="stat-card-body">
            <div className="stat-card-value" style={{ color: '#f59e0b' }}>{stats.cho_xu_ly}</div>
            <div className="stat-card-label">CHỜ XỬ LÝ</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171', boxShadow: '0 0 0 1px rgba(239,68,68,0.2)' }}>❌</div>
          <div className="stat-card-body">
            <div className="stat-card-value" style={{ color: '#ef4444' }}>{stats.tu_choi}</div>
            <div className="stat-card-label">ĐÃ TỪ CHỐI</div>
          </div>
        </div>
      </div>

      {/* Thống kê theo bước (Biểu đồ) */}
      {Object.keys(stats.steps).length > 0 && (
        <div className="card" style={{ marginBottom: '20px', padding: '20px' }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '20px' }}>📊</span> Biểu đồ hồ sơ đang thực hiện theo bước
          </h3>
          <div style={{ height: '300px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={Object.entries(stats.steps).map(([step, count]) => ({ name: `Bước ${step}`, count }))}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--color-text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} stroke="var(--color-text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: '8px', color: 'var(--color-text)' }}
                  itemStyle={{ color: 'var(--color-primary)', fontWeight: 'bold' }}
                />
                <Bar dataKey="count" name="Số hồ sơ" radius={[4, 4, 0, 0]} maxBarSize={60}>
                  {
                    Object.entries(stats.steps).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill="var(--color-primary)" />
                    ))
                  }
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="danhmuc-container">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h2>📈 Báo cáo - Thống kê chi tiết</h2>
          <button className="btn btn-primary" onClick={handleExport}>
            📥 Xuất File Excel
          </button>
        </div>
        
        {/* 2. Bộ lọc thông minh */}
        <div className="toolbar" style={{ flexWrap: 'wrap' }}>
          <div className="toolbar-search">
            <span className="toolbar-search-icon">🔍</span>
            <input 
              type="text" 
              placeholder="Tên, CCCD..." 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)} 
            />
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {!isThanhVien && (
              <div style={{ position: 'relative' }}>
                <input 
                  list="chibo-options"
                  className="form-input" 
                  style={{ width: '220px', padding: '0.375rem 0.75rem' }}
                  placeholder="Tất cả đơn vị (Nhập để tìm...)"
                  value={filterChiBo} 
                  onChange={e => setFilterChiBo(e.target.value)}
                />
                <datalist id="chibo-options">
                  <option value="">Tất cả đơn vị</option>
                  {chiBoList.map(cb => (
                    <option key={cb.ten} value={cb.ten} />
                  ))}
                </datalist>
              </div>
            )}

            <select 
              className="form-input" 
              style={{ width: 'auto', padding: '0.375rem 0.75rem' }}
              value={filterStatus} 
              onChange={e => setFilterStatus(e.target.value)}
            >
              {STATUS_FILTER_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>

            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <label style={{ fontSize: '13px', margin: 0 }}>Từ:</label>
              <input 
                type="date" 
                className="form-input" 
                style={{ padding: '0.375rem 0.75rem' }}
                value={dateFrom} 
                onChange={e => setDateFrom(e.target.value)} 
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <label style={{ fontSize: '13px', margin: 0 }}>Đến:</label>
              <input 
                type="date" 
                className="form-input" 
                style={{ padding: '0.375rem 0.75rem' }}
                value={dateTo} 
                onChange={e => setDateTo(e.target.value)} 
              />
            </div>
          </div>
        </div>

        {/* 3. Danh sách kết quả */}
        <div className="data-table-wrapper">
          <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>HỌ TÊN</th>
                  <th>CCCD</th>
                  <th>CHI BỘ/ĐẢNG BỘ</th>
                  <th>NGÀY NỘP</th>
                  <th>TIẾN ĐỘ</th>
                  <th>TÌNH TRẠNG</th>
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
                    const currentStep = getCurrentStep(a);
                    const totalSteps = a.quyTrinh?.length || 10;
                    return (
                      <tr key={a.id}>
                        <td>{i + 1}</td>
                        <td style={{ fontWeight: '600' }}>{a.hoTen}</td>
                        <td style={{ fontSize: 'var(--text-xs)' }}>{a.cccd}</td>
                        <td style={{ fontSize: 'var(--text-xs)' }}>{a.chiBoDangBo}</td>
                        <td style={{ fontSize: 'var(--text-xs)' }}>{new Date(a.ngayTao).toLocaleDateString('vi-VN')}</td>
                        <td>
                          {st === 'huy_ho_so' ? (
                            <span className="status-badge status-huy_ho_so">✕ Bị từ chối</span>
                          ) : (
                            <div className="step-progress-cell">
                              <span className="status-badge status-dang_xu_ly">
                                Bước {currentStep}/{totalSteps}
                              </span>
                            </div>
                          )}
                        </td>
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
  );
}
