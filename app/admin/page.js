'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  getAllApplicants,
  addApplicant,
  updateApplicant,
  deleteApplicant,
  updateProcessStep,
  getStatistics,
  initializeData,
  getCurrentStep,
} from '../lib/store';
import {
  ADMIN_CREDENTIALS,
  STATUS_LABELS,
  STATUSES,
  CHI_BO_LIST,
  DEFAULT_PROCESS_STEPS,
} from '../lib/constants';
import ProcessTimeline from '../components/ProcessTimeline';

// =============================================
// Admin Page Component
// =============================================
export default function AdminPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [applicants, setApplicants] = useState([]);
  const [stats, setStats] = useState(null);
  const [alert, setAlert] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal states
  const [showApplicantModal, setShowApplicantModal] = useState(false);
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [editingApplicant, setEditingApplicant] = useState(null);
  const [selectedApplicant, setSelectedApplicant] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    cccd: '', hoTen: '', ngaySinh: '', soDienThoai: '', email: '', chiBoDangBo: '',
  });

  // ---- Init ----
  useEffect(() => {
    initializeData();
    const savedAuth = sessionStorage.getItem('xaydungdang_auth');
    if (savedAuth === 'true') {
      setIsLoggedIn(true);
    }
  }, []);

  // ---- Load data when logged in ----
  const loadData = useCallback(() => {
    const data = getAllApplicants();
    setApplicants(data);
    setStats(getStatistics());
  }, []);

  useEffect(() => {
    if (isLoggedIn) loadData();
  }, [isLoggedIn, loadData]);

  // ---- Auto-hide alerts ----
  useEffect(() => {
    if (alert) {
      const timer = setTimeout(() => setAlert(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  // ---- Login ----
  const handleLogin = (e) => {
    e.preventDefault();
    if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
      setIsLoggedIn(true);
      setLoginError('');
      sessionStorage.setItem('xaydungdang_auth', 'true');
    } else {
      setLoginError('Tên đăng nhập hoặc mật khẩu không đúng!');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    sessionStorage.removeItem('xaydungdang_auth');
    setUsername('');
    setPassword('');
  };

  // ---- CRUD Applicants ----
  const openAddModal = () => {
    setEditingApplicant(null);
    setFormData({ cccd: '', hoTen: '', ngaySinh: '', soDienThoai: '', email: '', chiBoDangBo: '' });
    setShowApplicantModal(true);
  };

  const openEditModal = (applicant) => {
    setEditingApplicant(applicant);
    setFormData({
      cccd: applicant.cccd,
      hoTen: applicant.hoTen,
      ngaySinh: applicant.ngaySinh,
      soDienThoai: applicant.soDienThoai,
      email: applicant.email,
      chiBoDangBo: applicant.chiBoDangBo,
    });
    setShowApplicantModal(true);
  };

  const handleSaveApplicant = (e) => {
    e.preventDefault();
    try {
      if (editingApplicant) {
        updateApplicant(editingApplicant.id, formData);
        setAlert({ type: 'success', message: 'Cập nhật thông tin thành công!' });
      } else {
        addApplicant(formData);
        setAlert({ type: 'success', message: 'Thêm quần chúng mới thành công!' });
      }
      setShowApplicantModal(false);
      loadData();
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
    }
  };

  const handleDelete = (id) => {
    deleteApplicant(id);
    setShowDeleteConfirm(null);
    loadData();
    setAlert({ type: 'success', message: 'Đã xóa hồ sơ thành công!' });
  };

  // ---- Process Management ----
  const openProcessModal = (applicant) => {
    setSelectedApplicant(applicant);
    setShowProcessModal(true);
  };

  const handleUpdateStep = (soThuTu, trangThai) => {
    try {
      updateProcessStep(selectedApplicant.id, soThuTu, trangThai);
      const updated = getAllApplicants().find(a => a.id === selectedApplicant.id);
      setSelectedApplicant(updated);
      loadData();
      setAlert({ type: 'success', message: `Cập nhật bước ${soThuTu} thành công!` });
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
    }
  };

  // ---- Filter applicants ----
  const filteredApplicants = applicants.filter(a => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return a.hoTen.toLowerCase().includes(term) ||
           a.cccd.includes(term) ||
           a.chiBoDangBo.toLowerCase().includes(term);
  });

  // ---- LOGIN SCREEN ----
  if (!isLoggedIn) {
    return (
      <>
        <header className="header">
          <div className="header-inner">
            <Link href="/" className="header-logo">
              <div className="header-logo-icon">☆</div>
              <div className="header-logo-text">XÂY DỰNG <span>ĐẢNG</span></div>
            </Link>
            <nav className="header-nav">
              <Link href="/" className="header-nav-link">🔍 Tra cứu</Link>
              <Link href="/admin" className="header-nav-link active">🔐 Quản trị</Link>
            </nav>
          </div>
        </header>

        <div className="admin-login">
          <div className="admin-login-card">
            <div className="admin-login-icon">🔐</div>
            <h2>Đăng nhập Quản trị</h2>
            <p>Nhập thông tin đăng nhập để truy cập trang quản trị</p>

            {loginError && (
              <div className="alert alert-error">⚠️ {loginError}</div>
            )}

            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label htmlFor="login-username">Tên đăng nhập</label>
                <input
                  id="login-username"
                  type="text"
                  className="form-input"
                  placeholder="Nhập tên đăng nhập"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="login-password">Mật khẩu</label>
                <input
                  id="login-password"
                  type="password"
                  className="form-input"
                  placeholder="Nhập mật khẩu"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary btn-block mt-2">
                Đăng nhập
              </button>
            </form>
          </div>
        </div>
      </>
    );
  }

  // ---- ADMIN DASHBOARD ----
  return (
    <>
      <header className="header">
        <div className="header-inner">
          <Link href="/" className="header-logo">
            <div className="header-logo-icon">☆</div>
            <div className="header-logo-text">XÂY DỰNG <span>ĐẢNG</span></div>
          </Link>
          <nav className="header-nav">
            <Link href="/" className="header-nav-link">🔍 Tra cứu</Link>
            <Link href="/admin" className="header-nav-link active">🔐 Quản trị</Link>
            <button onClick={handleLogout} className="btn btn-sm btn-danger" style={{ marginLeft: '8px' }}>
              Đăng xuất
            </button>
          </nav>
        </div>
      </header>

      <div className="admin-container">
        {/* Alert */}
        {alert && (
          <div className={`alert alert-${alert.type}`}>
            {alert.type === 'success' ? '✅' : '❌'} {alert.message}
          </div>
        )}

        {/* Tabs */}
        <div className="tabs">
          <button 
            className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            📊 Tổng quan
          </button>
          <button
            className={`tab-btn ${activeTab === 'applicants' ? 'active' : ''}`}
            onClick={() => setActiveTab('applicants')}
          >
            👥 Quần chúng
          </button>
          <button
            className={`tab-btn ${activeTab === 'processes' ? 'active' : ''}`}
            onClick={() => setActiveTab('processes')}
          >
            📋 Quy trình
          </button>
        </div>

        {/* ====== DASHBOARD TAB ====== */}
        {activeTab === 'dashboard' && stats && (
          <>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-card-icon" style={{ background: 'rgba(59,130,246,0.15)', color: '#60a5fa' }}>📁</div>
                <div className="stat-card-value" style={{ color: '#60a5fa' }}>{stats.tongSo}</div>
                <div className="stat-card-label">Tổng hồ sơ</div>
              </div>
              <div className="stat-card">
                <div className="stat-card-icon" style={{ background: 'rgba(59,130,246,0.15)', color: '#3b82f6' }}>🔄</div>
                <div className="stat-card-value" style={{ color: '#3b82f6' }}>{stats.dangXuLy}</div>
                <div className="stat-card-label">Đang xử lý</div>
              </div>
              <div className="stat-card">
                <div className="stat-card-icon" style={{ background: 'rgba(16,185,129,0.15)', color: '#34d399' }}>✅</div>
                <div className="stat-card-value" style={{ color: '#10b981' }}>{stats.daHoanThanh}</div>
                <div className="stat-card-label">Hoàn thành</div>
              </div>
              <div className="stat-card">
                <div className="stat-card-icon" style={{ background: 'rgba(245,158,11,0.15)', color: '#fbbf24' }}>⏳</div>
                <div className="stat-card-value" style={{ color: '#f59e0b' }}>{stats.choXuLy}</div>
                <div className="stat-card-label">Chờ xử lý</div>
              </div>
              <div className="stat-card">
                <div className="stat-card-icon" style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171' }}>❌</div>
                <div className="stat-card-value" style={{ color: '#ef4444' }}>{stats.daHuy}</div>
                <div className="stat-card-label">Đã hủy</div>
              </div>
            </div>

            {/* Recent applicants */}
            <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, marginBottom: '1rem' }}>
              Hồ sơ gần đây
            </h3>
            <div className="data-table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Họ tên</th>
                    <th>CCCD</th>
                    <th>Chi bộ/Đảng bộ</th>
                    <th>Tiến độ</th>
                    <th>Ngày tạo</th>
                  </tr>
                </thead>
                <tbody>
                  {applicants.slice(0, 5).map((a, i) => {
                    const step = getCurrentStep(a);
                    const isCancelled = step === -1;
                    return (
                      <tr key={a.id}>
                        <td>{i + 1}</td>
                        <td style={{ fontWeight: 600 }}>{a.hoTen}</td>
                        <td>{a.cccd}</td>
                        <td style={{ fontSize: 'var(--text-xs)' }}>{a.chiBoDangBo}</td>
                        <td>
                          {isCancelled ? (
                            <span className="status-badge status-huy_ho_so">✕ Hủy</span>
                          ) : (
                            <span className="status-badge status-dang_xu_ly">
                              Bước {step}/{a.quyTrinh.length}
                            </span>
                          )}
                        </td>
                        <td style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                          {new Date(a.ngayTao).toLocaleDateString('vi-VN')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ====== APPLICANTS TAB ====== */}
        {activeTab === 'applicants' && (
          <>
            <div className="toolbar">
              <div className="toolbar-search">
                <span className="toolbar-search-icon">🔍</span>
                <input
                  type="text"
                  placeholder="Tìm kiếm theo tên, CCCD, chi bộ..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <button className="btn btn-accent" onClick={openAddModal}>
                ＋ Thêm quần chúng
              </button>
            </div>

            {filteredApplicants.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">👥</div>
                <h3>Chưa có dữ liệu</h3>
                <p>Bấm &quot;Thêm quần chúng&quot; để bắt đầu nhập dữ liệu</p>
              </div>
            ) : (
              <div className="data-table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Họ tên</th>
                      <th>CCCD</th>
                      <th>Ngày sinh</th>
                      <th>SĐT</th>
                      <th>Chi bộ/Đảng bộ</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredApplicants.map((a, i) => (
                      <tr key={a.id}>
                        <td>{i + 1}</td>
                        <td style={{ fontWeight: 600 }}>{a.hoTen}</td>
                        <td>{a.cccd}</td>
                        <td style={{ fontSize: 'var(--text-xs)' }}>
                          {new Date(a.ngaySinh).toLocaleDateString('vi-VN')}
                        </td>
                        <td style={{ fontSize: 'var(--text-xs)' }}>{a.soDienThoai}</td>
                        <td style={{ fontSize: 'var(--text-xs)' }}>{a.chiBoDangBo}</td>
                        <td>
                          <div className="table-actions">
                            <button className="btn btn-sm btn-secondary" onClick={() => openEditModal(a)}>
                              ✏️
                            </button>
                            <button className="btn btn-sm btn-secondary" onClick={() => openProcessModal(a)}>
                              📋
                            </button>
                            <button className="btn btn-sm btn-danger" onClick={() => setShowDeleteConfirm(a.id)}>
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* ====== PROCESSES TAB ====== */}
        {activeTab === 'processes' && (
          <>
            <div className="toolbar">
              <div className="toolbar-search">
                <span className="toolbar-search-icon">🔍</span>
                <input
                  type="text"
                  placeholder="Tìm kiếm theo tên, CCCD..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {filteredApplicants.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📋</div>
                <h3>Chưa có dữ liệu</h3>
                <p>Vui lòng thêm quần chúng trước</p>
              </div>
            ) : (
              filteredApplicants.map((a) => {
                const step = getCurrentStep(a);
                const isCancelled = step === -1;
                const progress = Math.round(
                  (a.quyTrinh.filter(s => s.trangThai === 'da_nhan_phan_hoi').length / a.quyTrinh.length) * 100
                );

                return (
                  <div key={a.id} className="applicant-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '8px' }}>
                      <div>
                        <div className="applicant-name">{a.hoTen}</div>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                          CCCD: {a.cccd} &nbsp;|&nbsp; {a.chiBoDangBo}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {isCancelled ? (
                          <span className="status-badge status-huy_ho_so">✕ Hủy hồ sơ</span>
                        ) : (
                          <span className="status-badge status-dang_xu_ly">{progress}% — Bước {step}/10</span>
                        )}
                        <button className="btn btn-sm btn-accent" onClick={() => openProcessModal(a)}>
                          Cập nhật
                        </button>
                      </div>
                    </div>
                    <ProcessTimeline quyTrinh={a.quyTrinh} compact />
                  </div>
                );
              })
            )}
          </>
        )}
      </div>

      {/* ====== MODALS ====== */}

      {/* Add/Edit Applicant Modal */}
      {showApplicantModal && (
        <div className="modal-overlay" onClick={() => setShowApplicantModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingApplicant ? '✏️ Sửa thông tin' : '➕ Thêm quần chúng mới'}</h3>
              <button className="modal-close" onClick={() => setShowApplicantModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSaveApplicant}>
              <div className="modal-body">
                <div className="form-group">
                  <label htmlFor="form-cccd">Số CCCD *</label>
                  <input
                    id="form-cccd"
                    type="text"
                    className="form-input"
                    placeholder="Nhập số CCCD (12 số)"
                    value={formData.cccd}
                    onChange={(e) => setFormData({ ...formData, cccd: e.target.value })}
                    maxLength={12}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="form-hoten">Họ tên *</label>
                  <input
                    id="form-hoten"
                    type="text"
                    className="form-input"
                    placeholder="Nhập họ và tên"
                    value={formData.hoTen}
                    onChange={(e) => setFormData({ ...formData, hoTen: e.target.value })}
                    required
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="form-ngaysinh">Ngày sinh *</label>
                    <input
                      id="form-ngaysinh"
                      type="date"
                      className="form-input"
                      value={formData.ngaySinh}
                      onChange={(e) => setFormData({ ...formData, ngaySinh: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="form-sdt">Số điện thoại</label>
                    <input
                      id="form-sdt"
                      type="tel"
                      className="form-input"
                      placeholder="0901234567"
                      value={formData.soDienThoai}
                      onChange={(e) => setFormData({ ...formData, soDienThoai: e.target.value })}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="form-email">Email</label>
                  <input
                    id="form-email"
                    type="email"
                    className="form-input"
                    placeholder="email@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="form-chibo">Chi bộ / Đảng bộ cơ sở *</label>
                  <select
                    id="form-chibo"
                    className="form-select"
                    value={formData.chiBoDangBo}
                    onChange={(e) => setFormData({ ...formData, chiBoDangBo: e.target.value })}
                    required
                  >
                    <option value="">-- Chọn chi bộ / đảng bộ --</option>
                    {CHI_BO_LIST.map((cb) => (
                      <option key={cb} value={cb}>{cb}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowApplicantModal(false)}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingApplicant ? 'Cập nhật' : 'Thêm mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Process Management Modal */}
      {showProcessModal && selectedApplicant && (
        <div className="modal-overlay" onClick={() => setShowProcessModal(false)}>
          <div className="modal modal-wide" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📋 Quản lý quy trình — {selectedApplicant.hoTen}</h3>
              <button className="modal-close" onClick={() => setShowProcessModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: '1rem', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                CCCD: {selectedApplicant.cccd} &nbsp;|&nbsp; {selectedApplicant.chiBoDangBo}
              </div>

              {selectedApplicant.quyTrinh.map((step) => (
                <div key={step.soThuTu} className="process-step-row">
                  <div className="process-step-number">{step.soThuTu}</div>
                  <div className="process-step-name">{step.tenQuyTrinh}</div>
                  <select
                    className="process-step-select"
                    value={step.trangThai}
                    onChange={(e) => handleUpdateStep(step.soThuTu, e.target.value)}
                  >
                    <option value={STATUSES.CHUA_BAT_DAU}>{STATUS_LABELS.chua_bat_dau}</option>
                    <option value={STATUSES.DA_GUI}>{STATUS_LABELS.da_gui}</option>
                    <option value={STATUSES.DANG_XU_LY}>{STATUS_LABELS.dang_xu_ly}</option>
                    <option value={STATUSES.DA_NHAN_PHAN_HOI}>{STATUS_LABELS.da_nhan_phan_hoi}</option>
                    <option value={STATUSES.HUY_HO_SO}>{STATUS_LABELS.huy_ho_so}</option>
                  </select>
                  <span className={`status-badge status-${step.trangThai}`}>
                    {STATUS_LABELS[step.trangThai]}
                  </span>
                </div>
              ))}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowProcessModal(false)}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(null)}>
          <div className="modal" style={{ maxWidth: '400px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>⚠️ Xác nhận xóa</h3>
              <button className="modal-close" onClick={() => setShowDeleteConfirm(null)}>✕</button>
            </div>
            <div className="modal-body">
              <p>Bạn có chắc chắn muốn xóa hồ sơ này? Hành động này không thể hoàn tác.</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowDeleteConfirm(null)}>
                Hủy
              </button>
              <button className="btn btn-danger" onClick={() => handleDelete(showDeleteConfirm)}>
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="footer">
        <p>© 2025 Hệ Thống Quản Lý Quy Trình Kết Nạp Đảng — Trang Quản Trị</p>
      </footer>
    </>
  );
}
