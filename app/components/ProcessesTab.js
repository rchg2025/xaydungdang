'use client';

import { useState } from 'react';
import { updateProcessStepAPI, getCurrentStep } from '../lib/apiClient';
import { sendChiBoStatusNotification } from '../lib/emailService';
import { STATUS_LABELS, STATUSES } from '../lib/constants';
import ProcessTimeline from './ProcessTimeline';

// =============================================
// Processes Tab — quản lý quy trình từng quần chúng
// =============================================
export default function ProcessesTab({ applicants, userIsAdmin, currentUser, onAlert, onReload }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [editingStep, setEditingStep] = useState(null); // { applicantId, soThuTu, value, lyDo }
  const [isUpdating, setIsUpdating] = useState(false);

  // Trạng thái tổng thể của 1 hồ sơ
  const getApplicantStatus = (a) => {
    const hasHuy = a.quyTrinh.some(s => s.trangThai === STATUSES.HUY_HO_SO);
    if (hasHuy) return 'huy_ho_so';
    const allDone = a.quyTrinh.every(s => s.trangThai === STATUSES.DA_NHAN_PHAN_HOI);
    if (allDone) return 'hoan_thanh';
    const hasDang = a.quyTrinh.some(s => s.trangThai === STATUSES.DANG_XU_LY);
    if (hasDang) return 'dang_xu_ly';
    const hasGui = a.quyTrinh.some(s => s.trangThai === STATUSES.DA_GUI);
    if (hasGui) return 'da_gui';
    return 'cho_xu_ly';
  };

  // Sort newest first + filter
  const sorted = [...applicants].sort((a, b) => new Date(b.ngayTao) - new Date(a.ngayTao));
  const filtered = sorted.filter(a => {
    if (!searchTerm) return true;
    const t = searchTerm.toLowerCase();
    return a.hoTen.toLowerCase().includes(t) || a.cccd.includes(t);
  });

  const handleUpdateStep = async (applicantId, soThuTu, trangThai, lyDo = '') => {
    setIsUpdating(true);
    try {
      const ghiChu = trangThai === STATUSES.HUY_HO_SO && lyDo.trim()
        ? `Lý do từ chối: ${lyDo.trim()}`
        : lyDo.trim();
      const updatedApplicant = await updateProcessStepAPI(applicantId, soThuTu, trangThai, ghiChu, currentUser?.hoTen || '');
      
      // Update local state instantly and hide input
      onAlert({ type: 'success', message: `Đã cập nhật bước ${soThuTu}!` });
      setEditingStep(null);
      setIsUpdating(false);
      onReload(); // reload parent
      
      // Send email notification dynamically IN THE BACKGROUND (without await)
      const stepObj = updatedApplicant.quyTrinh.find(s => s.soThuTu === soThuTu);
      if (stepObj) {
        const overallStatus = getApplicantStatus(updatedApplicant);
        sendChiBoStatusNotification(
            updatedApplicant, 
            { soThuTu, tenQuyTrinh: stepObj.tenQuyTrinh }, 
            STATUS_LABELS[trangThai], 
            currentUser?.hoTen || '', 
            overallStatus
        ).catch(emailErr => console.error('Email failed: ', emailErr));
      }

    } catch (err) {
      setIsUpdating(false);
      onAlert({ type: 'error', message: err.message });
    }
  };

  const getProgressPercent = (a) => {
    const completed = a.quyTrinh.filter(s => s.trangThai === STATUSES.DA_NHAN_PHAN_HOI).length;
    return Math.round((completed / a.quyTrinh.length) * 100);
  };

  if (filtered.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">📋</div>
        <h3>{searchTerm ? 'Không tìm thấy' : 'Chưa có dữ liệu'}</h3>
        <p>{searchTerm ? 'Thử từ khóa khác' : 'Hãy thêm quần chúng trước'}</p>
      </div>
    );
  }

  return (
    <>
      {/* Search */}
      <div className="toolbar">
        <div className="toolbar-search">
          <span className="toolbar-search-icon">🔍</span>
          <input
            type="text"
            placeholder="Tìm kiếm theo tên, CCCD..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
          {filtered.length} hồ sơ
        </span>
      </div>

      {/* Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {filtered.map(a => {
          const step = getCurrentStep(a);
          const isCancelled = step === -1;
          const progress = getProgressPercent(a);
          const isExpanded = expandedId === a.id;

          return (
            <div key={a.id} className="process-card">
              {/* Card header */}
              <div className="process-card-header">
                <div className="process-card-info">
                  <div className="process-card-name">{a.hoTen}</div>
                  <div className="process-card-meta">
                    <span>🪪 {a.cccd}</span>
                    <span>🏛️ {a.chiBoDangBo}</span>
                    {isCancelled ? (
                      <span className="status-badge status-huy_ho_so">✕ Hồ sơ bị từ chối</span>
                    ) : (
                      <span className="status-badge status-dang_xu_ly">Bước {step}/{a.quyTrinh.length} · {progress}%</span>
                    )}
                  </div>
                </div>
                <button
                  className={`expand-btn ${isExpanded ? 'expanded' : ''}`}
                  onClick={() => setExpandedId(isExpanded ? null : a.id)}
                >
                  <span className="expand-btn-icon">{isExpanded ? '▲' : '▼'}</span>
                  {isExpanded ? 'Thu gọn' : 'Cập nhật bước'}
                </button>
              </div>

              {/* Progress bar */}
              {!isCancelled && (
                <div className="process-card-progress">
                  <div className="process-card-bar">
                    <div className="process-card-bar-fill" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              )}

              {/* Expanded steps */}
              {isExpanded && (
                <div className="process-card-steps">
                  {a.quyTrinh.map(s => {
                    const isEditing = editingStep?.applicantId === a.id && editingStep?.soThuTu === s.soThuTu;
                    return (
                      <div key={s.soThuTu} className={`process-step-row process-step-${s.trangThai}`}>
                        <div className="process-step-number">{s.soThuTu}</div>
                        <div className="process-step-info">
                          <div className="process-step-name">{s.tenQuyTrinh}</div>
                          {s.nguoiCapNhat && (
                            <div className="process-step-audit">
                              👤 {s.nguoiCapNhat}
                              {s.gioCapNhat && ` · ${s.gioCapNhat}`}
                            </div>
                          )}
                        </div>

                        {/* Status badge or editable select */}
                        {isEditing ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '240px' }}>
                            <select
                              className="process-step-select"
                              value={editingStep.value}
                              onChange={e => setEditingStep({ ...editingStep, value: e.target.value, lyDo: e.target.value !== STATUSES.HUY_HO_SO ? '' : (editingStep.lyDo || '') })}
                              autoFocus
                            >
                              {Object.entries(STATUS_LABELS).map(([k, v]) => (
                                <option key={k} value={k}>{v}</option>
                              ))}
                            </select>
                            {editingStep.value === STATUSES.HUY_HO_SO && (
                              <input
                                type="text"
                                className="form-input"
                                style={{ fontSize: 'var(--text-xs)', padding: '6px 10px' }}
                                placeholder="Nhập lý do từ chối..."
                                value={editingStep.lyDo || ''}
                                onChange={e => setEditingStep({ ...editingStep, lyDo: e.target.value })}
                              />
                            )}
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button
                                className="btn btn-sm btn-primary"
                                onClick={() => handleUpdateStep(a.id, s.soThuTu, editingStep.value, editingStep.lyDo || '')}
                                disabled={isUpdating || (editingStep.value === STATUSES.HUY_HO_SO && !editingStep.lyDo?.trim())}
                              >
                                {isUpdating ? '⏳' : '✓'} Xác nhận
                              </button>
                              <button
                                className="btn btn-sm btn-secondary"
                                onClick={() => setEditingStep(null)}
                              >✕</button>
                            </div>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <span className={`status-badge status-${s.trangThai}`}>
                              {STATUS_LABELS[s.trangThai]}
                            </span>
                            <button
                              className="btn btn-sm btn-secondary"
                              onClick={() => setEditingStep({ applicantId: a.id, soThuTu: s.soThuTu, value: s.trangThai })}
                              title="Thay đổi trạng thái"
                            >✏️</button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
