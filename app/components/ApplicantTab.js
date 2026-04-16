'use client';

import { useState, useCallback } from 'react';
import {
  createApplicant,
  updateApplicantAPI,
  deleteApplicantAPI,
  updateProcessStepAPI,
  fetchApplicants,
  getCurrentStep,
} from '../lib/apiClient';
import { STATUS_LABELS, STATUSES } from '../lib/constants';
import { exportApplicantsToXlsx, exportImportTemplate, parseXlsxFile } from '../lib/excelUtils';
import { sendChiBoStatusNotification } from '../lib/emailService';
import ProcessTimeline from './ProcessTimeline';

const PAGE_SIZE = 10;

// Trạng thái tổng thể của 1 hồ sơ
function getApplicantStatus(a) {
  const hasHuy = a.quyTrinh.some(s => s.trangThai === STATUSES.HUY_HO_SO);
  if (hasHuy) return 'huy_ho_so';
  const allDone = a.quyTrinh.every(s => s.trangThai === STATUSES.DA_NHAN_PHAN_HOI);
  if (allDone) return 'hoan_thanh';
  const hasDang = a.quyTrinh.some(s => s.trangThai === STATUSES.DANG_XU_LY);
  if (hasDang) return 'dang_xu_ly';
  const hasGui = a.quyTrinh.some(s => s.trangThai === STATUSES.DA_GUI);
  if (hasGui) return 'da_gui';
  return 'cho_xu_ly';
}

const STATUS_FILTER_OPTIONS = [
  { value: 'dang_xu_ly', label: '🔄 Đang xử lý' },
  { value: 'da_gui',     label: '📤 Đã gửi'     },
  { value: 'hoan_thanh', label: '✅ Hoàn thành'  },
  { value: 'cho_xu_ly',  label: '⏳ Chờ xử lý'  },
  { value: 'huy_ho_so',  label: '❌ Hồ sơ bị từ chối' },
];

function Paginator({ page, total, onPage, totalItems }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
        Hiển thị {Math.min((page - 1) * PAGE_SIZE + 1, totalItems)}–{Math.min(page * PAGE_SIZE, totalItems)} / {totalItems} hồ sơ
      </span>
      {total > 1 && (
        <div className="pagination" style={{ padding: '0' }}>
          <button className="page-btn" onClick={() => onPage(p => Math.max(1, p - 1))} disabled={page === 1}>← Trước</button>
          {Array.from({ length: total }, (_, i) => i + 1).map(p => (
            <button key={p} className={`page-btn ${page === p ? 'active' : ''}`} onClick={() => onPage(p)}>{p}</button>
          ))}
          <button className="page-btn" onClick={() => onPage(p => Math.min(total, p + 1))} disabled={page === total}>Tiếp →</button>
        </div>
      )}
    </div>
  );
}

// =============================================
// Applicant Tab
// =============================================
export default function ApplicantTab({ applicants, chiBoList, userIsAdmin, currentUser, onAlert, onReload }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [chiBoSearch, setChiBoSearch] = useState('');
  const [showChiBoDropdown, setShowChiBoDropdown] = useState(false);
  const [page, setPage] = useState(1);

  // ---- Bộ lọc mới ----
  const [selectedStatuses, setSelectedStatuses] = useState([]); // multi-select
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo]     = useState('');
  const [showFilterBar, setShowFilterBar] = useState(false);

  // Modals
  const [showApplicantModal, setShowApplicantModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [editingApplicant, setEditingApplicant] = useState(null);
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [selectedApplicant, setSelectedApplicant] = useState(null);

  // Import
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importPreview, setImportPreview] = useState([]);
  const [importErrors, setImportErrors] = useState([]);
  const [importLoading, setImportLoading] = useState(false);

  // Form
  const [formData, setFormData] = useState({
    cccd: '', hoTen: '', ngaySinh: '', soDienThoai: '', email: '', chiBoDangBo: '',
  });

  // Toggle status in multi-select
  const toggleStatus = (val) => {
    setSelectedStatuses(prev =>
      prev.includes(val) ? prev.filter(s => s !== val) : [...prev, val]
    );
    setPage(1);
  };

  const clearFilters = () => {
    setSelectedStatuses([]);
    setDateFrom('');
    setDateTo('');
    setSearchTerm('');
    setPage(1);
  };

  const hasActiveFilter = selectedStatuses.length > 0 || dateFrom || dateTo;

  // Sort newest first + filter
  const sorted = [...applicants].sort((a, b) => new Date(b.ngayTao) - new Date(a.ngayTao));
  const filtered = sorted.filter(a => {
    // Text search
    if (searchTerm) {
      const t = searchTerm.toLowerCase();
      if (!a.hoTen.toLowerCase().includes(t) && !a.cccd.includes(t) && !a.chiBoDangBo.toLowerCase().includes(t)) return false;
    }
    // Status filter
    if (selectedStatuses.length > 0) {
      if (!selectedStatuses.includes(getApplicantStatus(a))) return false;
    }
    // Date from
    if (dateFrom && a.ngayTao < dateFrom) return false;
    // Date to
    if (dateTo && a.ngayTao > dateTo) return false;
    return true;
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // ---- CRUD ----
  const openAdd = () => {
    setEditingApplicant(null);
    setFormData({ cccd: '', hoTen: '', ngaySinh: '', soDienThoai: '', email: '', chiBoDangBo: '' });
    setChiBoSearch('');
    setShowApplicantModal(true);
  };

  const openEdit = (a) => {
    setEditingApplicant(a);
    setFormData({ cccd: a.cccd, hoTen: a.hoTen, ngaySinh: a.ngaySinh, soDienThoai: a.soDienThoai, email: a.email, chiBoDangBo: a.chiBoDangBo });
    setChiBoSearch(a.chiBoDangBo);
    setShowApplicantModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingApplicant) {
        await updateApplicantAPI(editingApplicant.id, formData);
        onAlert({ type: 'success', message: 'Cập nhật thông tin thành công!' });
      } else {
        await createApplicant(formData);
        onAlert({ type: 'success', message: 'Thêm quần chúng mới thành công!' });
      }
      setShowApplicantModal(false);
      onReload();
    } catch (err) {
      onAlert({ type: 'error', message: err.message });
    }
  };

  const handleDelete = async (id) => {
    await deleteApplicantAPI(id);
    setShowDeleteConfirm(null);
    onReload();
    onAlert({ type: 'success', message: 'Đã xóa hồ sơ thành công!' });
  };

  // ---- Process update ----
  const openProcess = (a) => { setSelectedApplicant(a); setShowProcessModal(true); };

  const handleUpdateStep = async (soThuTu, trangThai) => {
    try {
      const updated = await updateProcessStepAPI(selectedApplicant.id, soThuTu, trangThai, '', currentUser?.hoTen || '');
      setSelectedApplicant(updated);
      onReload();
      onAlert({ type: 'success', message: `Cập nhật bước ${soThuTu} thành công!` });

      // Gửi email thông báo cho chi bộ (nếu chi bộ có email)
      const step = updated.quyTrinh.find(s => s.soThuTu === soThuTu);
      if (step) {
        try {
          const overallStatus = getApplicantStatus(updated);
          const result = await sendChiBoStatusNotification(
            updated, step, STATUS_LABELS[trangThai] || trangThai, currentUser?.hoTen || '', overallStatus
          );
          if (result) {
            onAlert({ type: 'success', message: '📧 Đã gửi email thông báo cho Chi bộ/Đảng bộ!' });
          }
        } catch (emailErr) {
          // Không block nếu gửi email thất bại
          console.warn('Email notification failed:', emailErr);
        }
      }
    } catch (err) {
      onAlert({ type: 'error', message: err.message });
    }
  };

  // ---- Export (filtered) ----
  const handleExport = () => {
    try {
      const label = [
        hasActiveFilter && 'bo-loc',
        selectedStatuses.length > 0 && selectedStatuses.join('-'),
        dateFrom && `tu-${dateFrom}`,
        dateTo && `den-${dateTo}`,
      ].filter(Boolean).join('_');
      exportApplicantsToXlsx(filtered, label || undefined);
      onAlert({ type: 'success', message: `Xuất ${filtered.length} hồ sơ ra Excel thành công!` });
    } catch (err) {
      onAlert({ type: 'error', message: 'Lỗi xuất file: ' + err.message });
    }
  };

  // ---- Import ----
  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImportFile(file);
    setImportLoading(true);
    try {
      const { data, errors } = await parseXlsxFile(file);
      setImportPreview(data);
      setImportErrors(errors);
    } catch (err) {
      setImportErrors([err.message]);
      setImportPreview([]);
    }
    setImportLoading(false);
  };

  const handleImportConfirm = async () => {
    let success = 0;
    const failed = [];
    for (const row of importPreview) {
      try { await createApplicant(row); success++; }
      catch (err) { failed.push(`${row.hoTen}: ${err.message}`); }
    }
    onReload();
    setShowImportModal(false);
    setImportFile(null); setImportPreview([]); setImportErrors([]);
    if (!failed.length) {
      onAlert({ type: 'success', message: `Đã nhập thành công ${success} hồ sơ!` });
    } else {
      onAlert({ type: 'error', message: `Nhập ${success} thành công, ${failed.length} thất bại: ${failed.join('; ')}` });
    }
  };

  const closeImport = () => {
    setShowImportModal(false); setImportFile(null); setImportPreview([]); setImportErrors([]);
  };

  // ---- Get current step name ----
  const getStepName = (a) => {
    const step = getCurrentStep(a);
    if (step === -1) return null; // cancelled
    // Find the next pending step (what they're working on)
    const nextStep = a.quyTrinh.find(s =>
      s.trangThai === STATUSES.DANG_XU_LY || s.trangThai === STATUSES.DA_GUI || s.trangThai === STATUSES.CHUA_BAT_DAU
    );
    if (nextStep) return { num: nextStep.soThuTu, name: nextStep.tenQuyTrinh };
    return { num: a.quyTrinh.length, name: a.quyTrinh[a.quyTrinh.length - 1]?.tenQuyTrinh };
  };

  return (
    <>
      {/* Toolbar */}
      <div className="toolbar">
        <div className="toolbar-search">
          <span className="toolbar-search-icon">🔍</span>
          <input
            type="text"
            placeholder="Tìm kiếm theo tên, CCCD, chi bộ..."
            value={searchTerm}
            onChange={e => { setSearchTerm(e.target.value); setPage(1); }}
          />
        </div>
        <div className="toolbar-actions">
          <button
            className={`btn btn-secondary ${showFilterBar ? 'active' : ''} ${hasActiveFilter ? 'filter-active' : ''}`}
            onClick={() => setShowFilterBar(v => !v)}
            id="btn-filter"
          >
            📂 Bộ lọc {hasActiveFilter && <span className="filter-badge">{selectedStatuses.length + (dateFrom ? 1 : 0) + (dateTo ? 1 : 0)}</span>}
          </button>
          {userIsAdmin && (
            <>
              <button className="btn btn-secondary" onClick={() => exportImportTemplate()} id="btn-download-template">📄 File mẫu</button>
              <button className="btn btn-secondary" onClick={() => setShowImportModal(true)} id="btn-import">📥 Nhập Excel</button>
              <button className="btn btn-secondary" onClick={handleExport} disabled={filtered.length === 0} id="btn-export" title={`Xuất ${filtered.length} hồ sơ hiện tại`}>📤 Xuất Excel ({filtered.length})</button>
            </>
          )}
          <button className="btn btn-accent" onClick={openAdd} id="btn-add-applicant">＋ Thêm quần chúng</button>
        </div>
      </div>

      {/* Filter Bar */}
      {showFilterBar && (
        <div className="filter-bar">
          <div className="filter-bar-section">
            <div className="filter-bar-label">🟢 Trạng thái tiến độ</div>
            <div className="filter-status-chips">
              {STATUS_FILTER_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  className={`filter-chip ${selectedStatuses.includes(opt.value) ? 'selected' : ''}`}
                  onClick={() => toggleStatus(opt.value)}
                >
                  {opt.label}
                  {selectedStatuses.includes(opt.value) && <span className="chip-check">✓</span>}
                </button>
              ))}
            </div>
          </div>
          <div className="filter-bar-section">
            <div className="filter-bar-label">📅 Thời gian tạo hồ sơ</div>
            <div className="filter-date-range">
              <div className="filter-date-field">
                <span className="filter-date-label">Từ ngày</span>
                <input
                  type="date"
                  className="form-input filter-date-input"
                  value={dateFrom}
                  onChange={e => { setDateFrom(e.target.value); setPage(1); }}
                />
              </div>
              <span className="filter-date-sep">→</span>
              <div className="filter-date-field">
                <span className="filter-date-label">Đến ngày</span>
                <input
                  type="date"
                  className="form-input filter-date-input"
                  value={dateTo}
                  onChange={e => { setDateTo(e.target.value); setPage(1); }}
                />
              </div>
            </div>
          </div>
          {hasActiveFilter && (
            <div className="filter-bar-actions">
              <span className="filter-result-count">→ Đang lọc: <strong>{filtered.length}</strong> hồ sơ</span>
              <button className="btn btn-sm btn-secondary" onClick={clearFilters}>✕ Xóa bộ lọc</button>
            </div>
          )}
        </div>
      )}

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">👥</div>
          <h3>{searchTerm ? 'Không tìm thấy kết quả' : 'Chưa có dữ liệu'}</h3>
          <p>{searchTerm ? 'Thử tìm với từ khóa khác' : 'Bấm "Thêm quần chúng" để bắt đầu'}</p>
        </div>
      ) : (
        <>
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
                  <th>Tiến độ</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((a, i) => {
                  const step = getCurrentStep(a);
                  const isCancelled = step === -1;
                  const stepInfo = getStepName(a);

                  return (
                    <tr key={a.id}>
                      <td>{(page - 1) * PAGE_SIZE + i + 1}</td>
                      <td style={{ fontWeight: 600 }}>{a.hoTen}</td>
                      <td style={{ fontSize: 'var(--text-xs)' }}>{a.cccd}</td>
                      <td style={{ fontSize: 'var(--text-xs)' }}>{new Date(a.ngaySinh).toLocaleDateString('vi-VN')}</td>
                      <td style={{ fontSize: 'var(--text-xs)' }}>{a.soDienThoai}</td>
                      <td style={{ fontSize: 'var(--text-xs)' }}>{a.chiBoDangBo}</td>
                      <td>
                        {isCancelled ? (
                          <span className="status-badge status-huy_ho_so">✕ Hồ sơ bị từ chối</span>
                        ) : (
                          <div className="step-progress-cell">
                            <span className="status-badge status-dang_xu_ly">
                              Bước {stepInfo?.num || step}/{a.quyTrinh.length}
                            </span>
                            {stepInfo && (
                              <span className="step-name-label" title={stepInfo.name}>
                                {stepInfo.name}
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td>
                        <div className="table-actions">
                          {userIsAdmin && (
                            <button className="btn btn-sm btn-secondary" onClick={() => openEdit(a)} title="Sửa">✏️</button>
                          )}
                          <button className="btn btn-sm btn-secondary" onClick={() => openProcess(a)} title="Quy trình">📋</button>
                          {userIsAdmin && (
                            <button className="btn btn-sm btn-danger" onClick={() => setShowDeleteConfirm(a.id)} title="Xóa">🗑️</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Paginator page={page} total={totalPages} onPage={setPage} totalItems={filtered.length} />
        </>
      )}

      {/* ====== ADD/EDIT MODAL ====== */}
      {showApplicantModal && (
        <div className="modal-overlay" onClick={() => setShowApplicantModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingApplicant ? '✏️ Sửa thông tin' : '➕ Thêm quần chúng mới'}</h3>
              <button className="modal-close" onClick={() => setShowApplicantModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Số CCCD *</label>
                  <input type="text" className="form-input" required maxLength={12}
                    value={formData.cccd} onChange={e => setFormData({ ...formData, cccd: e.target.value })} placeholder="12 số" />
                </div>
                <div className="form-group">
                  <label>Họ tên *</label>
                  <input type="text" className="form-input" required
                    value={formData.hoTen} onChange={e => setFormData({ ...formData, hoTen: e.target.value })} placeholder="Nguyễn Văn A" />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Ngày sinh *</label>
                    <input type="date" className="form-input" required
                      value={formData.ngaySinh} onChange={e => setFormData({ ...formData, ngaySinh: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Số điện thoại</label>
                    <input type="tel" className="form-input"
                      value={formData.soDienThoai} onChange={e => setFormData({ ...formData, soDienThoai: e.target.value })} placeholder="0901234567" />
                  </div>
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input type="email" className="form-input"
                    value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="email@example.com" />
                </div>
                <div className="form-group" style={{ position: 'relative' }}>
                  <label>Chi bộ / Đảng bộ *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="-- Nhập hoặc chọn chi bộ/đảng bộ --"
                    required
                    value={chiBoSearch}
                    onFocus={() => setShowChiBoDropdown(true)}
                    onBlur={() => setTimeout(() => setShowChiBoDropdown(false), 200)}
                    onChange={e => {
                      setChiBoSearch(e.target.value);
                      setFormData({ ...formData, chiBoDangBo: e.target.value });
                      setShowChiBoDropdown(true);
                    }}
                  />
                  {showChiBoDropdown && (
                    <ul style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      maxHeight: '200px',
                      overflowY: 'auto',
                      background: 'var(--color-surface)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-sm)',
                      boxShadow: 'var(--shadow-md)',
                      zIndex: 99,
                      listStyle: 'none',
                      margin: '4px 0 0 0',
                      padding: 0
                    }}>
                      {chiBoList
                        .filter(cb => cb.ten.toLowerCase().includes(chiBoSearch.toLowerCase()))
                        .map(cb => (
                          <li
                            key={cb.ten}
                            style={{
                              padding: '10px 14px',
                              cursor: 'pointer',
                              borderBottom: '1px solid rgba(255,255,255,0.05)',
                              fontSize: 'var(--text-base)',
                              color: 'var(--color-text-primary)'
                            }}
                            onMouseDown={(e) => {
                              // Prevent onBlur from firing before click
                              e.preventDefault(); 
                              setChiBoSearch(cb.ten);
                              setFormData({ ...formData, chiBoDangBo: cb.ten });
                              setShowChiBoDropdown(false);
                            }}
                            onMouseEnter={e => e.target.style.background = 'var(--color-surface-hover)'}
                            onMouseLeave={e => e.target.style.background = 'transparent'}
                          >
                            {cb.ten}
                          </li>
                        ))}
                      {chiBoList.filter(cb => cb.ten.toLowerCase().includes(chiBoSearch.toLowerCase())).length === 0 && (
                        <li style={{ padding: '10px 14px', color: 'var(--color-text-muted)' }}>Không tìm thấy...</li>
                      )}
                    </ul>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowApplicantModal(false)}>Hủy</button>
                <button type="submit" className="btn btn-primary">{editingApplicant ? 'Cập nhật' : 'Thêm mới'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====== PROCESS MODAL ====== */}
      {showProcessModal && selectedApplicant && (
        <div className="modal-overlay" onClick={() => setShowProcessModal(false)}>
          <div className="modal modal-wide" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 style={{ margin: 0 }}>📋 Quy trình — {selectedApplicant.hoTen}</h3>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                  CCCD: {selectedApplicant.cccd} &nbsp;|&nbsp; {selectedApplicant.chiBoDangBo}
                </div>
              </div>
              <button className="modal-close" onClick={() => setShowProcessModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              {selectedApplicant.quyTrinh.map(step => (
                <div key={step.soThuTu} className="process-step-row">
                  <div className="process-step-number">{step.soThuTu}</div>
                  <div className="process-step-info">
                    <div className="process-step-name">{step.tenQuyTrinh}</div>
                    {step.nguoiCapNhat && (
                      <div className="process-step-audit">
                        👤 {step.nguoiCapNhat}{step.gioCapNhat && ` · ${step.gioCapNhat}`}
                      </div>
                    )}
                  </div>
                  <select
                    className="process-step-select"
                    value={step.trangThai}
                    onChange={e => handleUpdateStep(step.soThuTu, e.target.value)}
                  >
                    {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                  <span className={`status-badge status-${step.trangThai}`}>{STATUS_LABELS[step.trangThai]}</span>
                </div>
              ))}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowProcessModal(false)}>Đóng</button>
            </div>
          </div>
        </div>
      )}

      {/* ====== DELETE CONFIRM ====== */}
      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(null)}>
          <div className="modal" style={{ maxWidth: '400px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>⚠️ Xác nhận xóa</h3>
              <button className="modal-close" onClick={() => setShowDeleteConfirm(null)}>✕</button>
            </div>
            <div className="modal-body">
              <p>Bạn có chắc chắn muốn xóa hồ sơ này? Hành động này không thể hoàn tác.</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowDeleteConfirm(null)}>Hủy</button>
              <button className="btn btn-danger" onClick={() => handleDelete(showDeleteConfirm)}>Xóa</button>
            </div>
          </div>
        </div>
      )}

      {/* ====== IMPORT MODAL ====== */}
      {showImportModal && (
        <div className="modal-overlay" onClick={closeImport}>
          <div className="modal modal-wide" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📥 Nhập dữ liệu từ Excel</h3>
              <button className="modal-close" onClick={closeImport}>✕</button>
            </div>
            <div className="modal-body">
              <div className="import-step">
                <div className="import-step-title">
                  <span className="import-step-num">1</span> Chọn file Excel (.xlsx)
                </div>
                <div className="import-file-zone">
                  <input type="file" accept=".xlsx,.xls" id="import-file-input" style={{ display: 'none' }} onChange={handleFileSelect} />
                  <label htmlFor="import-file-input" className="import-file-label">
                    {importFile ? (
                      <><span style={{ fontSize: '1.5rem' }}>📄</span><span style={{ fontWeight: 600 }}>{importFile.name}</span></>
                    ) : (
                      <><span style={{ fontSize: '2rem' }}>📂</span><span style={{ fontWeight: 600 }}>Nhấn để chọn file Excel</span></>
                    )}
                  </label>
                </div>
                <div style={{ marginTop: '0.5rem', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                  💡 <button type="button" onClick={() => exportImportTemplate()} className="link-btn">Tải file mẫu nhập liệu</button>
                </div>
              </div>

              {importErrors.length > 0 && (
                <div className="import-errors">
                  <div className="import-errors-title">⚠️ {importErrors.length} lỗi:</div>
                  <ul>{importErrors.map((e, i) => <li key={i}>{e}</li>)}</ul>
                </div>
              )}

              {importPreview.length > 0 && (
                <div className="import-step">
                  <div className="import-step-title">
                    <span className="import-step-num">2</span> Xem trước — {importPreview.length} hồ sơ hợp lệ
                  </div>
                  <div className="data-table-wrapper" style={{ maxHeight: '250px', overflowY: 'auto' }}>
                    <table className="data-table">
                      <thead><tr><th>#</th><th>CCCD</th><th>Họ tên</th><th>Chi bộ/Đảng bộ</th></tr></thead>
                      <tbody>
                        {importPreview.map((row, i) => (
                          <tr key={i}><td>{i+1}</td><td>{row.cccd}</td><td style={{ fontWeight: 600 }}>{row.hoTen}</td><td style={{ fontSize: 'var(--text-xs)' }}>{row.chiBoDangBo}</td></tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              {importLoading && <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--color-text-muted)' }}>⏳ Đang đọc file...</div>}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={closeImport}>Hủy</button>
              <button className="btn btn-primary" onClick={handleImportConfirm} disabled={importPreview.length === 0 || importLoading}>
                ✅ Nhập {importPreview.length > 0 ? `${importPreview.length} hồ sơ` : ''}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
