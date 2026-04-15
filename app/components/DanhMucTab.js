'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  getChiBoList,
  addChiBo,
  updateChiBo,
  deleteChiBo,
  getProcessStepTemplates,
  addProcessStepTemplate,
  updateProcessStepTemplate,
  deleteProcessStepTemplate,
  moveProcessStepTemplate,
} from '../lib/store';

// =============================================
// Danh Mục Tab Component
// =============================================
export default function DanhMucTab({ onAlert, onChiBoChanged }) {
  const [subTab, setSubTab] = useState('quyTrinh');

  // ---- Quy trình state ----
  const [steps, setSteps] = useState([]);
  const [newStepName, setNewStepName] = useState('');
  const [editingStep, setEditingStep] = useState(null); // { soThuTu, tenQuyTrinh }
  const [editStepName, setEditStepName] = useState('');
  const [deletingStep, setDeletingStep] = useState(null);

  // ---- Chi bộ state ----
  const [chiBoList, setChiBoList] = useState([]);
  const [newChiBoName, setNewChiBoName] = useState('');
  const [editingChiBo, setEditingChiBo] = useState(null); // old name
  const [editChiBoName, setEditChiBoName] = useState('');
  const [deletingChiBo, setDeletingChiBo] = useState(null);
  const [chiBoSearch, setChiBoSearch] = useState('');
  const [stepSearch, setStepSearch] = useState('');

  // ---- Load data ----
  const loadSteps = useCallback(() => {
    setSteps(getProcessStepTemplates());
  }, []);

  const loadChiBo = useCallback(() => {
    setChiBoList(getChiBoList());
  }, []);

  useEffect(() => {
    loadSteps();
    loadChiBo();
  }, [loadSteps, loadChiBo]);

  // =============================================
  // QUY TRÌNH HANDLERS
  // =============================================
  const handleAddStep = (e) => {
    e.preventDefault();
    try {
      const updated = addProcessStepTemplate(newStepName);
      setSteps(updated);
      setNewStepName('');
      onAlert({ type: 'success', message: 'Đã thêm bước quy trình mới!' });
    } catch (err) {
      onAlert({ type: 'error', message: err.message });
    }
  };

  const handleEditStep = (step) => {
    setEditingStep(step);
    setEditStepName(step.tenQuyTrinh);
  };

  const handleSaveStep = (e) => {
    e.preventDefault();
    try {
      const updated = updateProcessStepTemplate(editingStep.soThuTu, editStepName);
      setSteps(updated);
      setEditingStep(null);
      onAlert({ type: 'success', message: 'Đã cập nhật tên bước quy trình!' });
    } catch (err) {
      onAlert({ type: 'error', message: err.message });
    }
  };

  const handleDeleteStep = (soThuTu) => {
    try {
      const updated = deleteProcessStepTemplate(soThuTu);
      setSteps(updated);
      setDeletingStep(null);
      onAlert({ type: 'success', message: 'Đã xóa bước quy trình!' });
    } catch (err) {
      onAlert({ type: 'error', message: err.message });
    }
  };

  const handleMoveStep = (soThuTu, direction) => {
    try {
      const updated = moveProcessStepTemplate(soThuTu, direction);
      setSteps(updated);
    } catch (err) {
      onAlert({ type: 'error', message: err.message });
    }
  };

  // =============================================
  // CHI BỘ HANDLERS
  // =============================================
  const handleAddChiBo = (e) => {
    e.preventDefault();
    try {
      const updated = addChiBo(newChiBoName);
      setChiBoList(updated);
      setNewChiBoName('');
      onAlert({ type: 'success', message: 'Đã thêm chi bộ/đảng bộ mới!' });
      if (onChiBoChanged) onChiBoChanged();
    } catch (err) {
      onAlert({ type: 'error', message: err.message });
    }
  };

  const handleEditChiBo = (name) => {
    setEditingChiBo(name);
    setEditChiBoName(name);
  };

  const handleSaveChiBo = (e) => {
    e.preventDefault();
    try {
      const updated = updateChiBo(editingChiBo, editChiBoName);
      setChiBoList(updated);
      setEditingChiBo(null);
      onAlert({ type: 'success', message: 'Đã cập nhật tên chi bộ/đảng bộ!' });
      if (onChiBoChanged) onChiBoChanged();
    } catch (err) {
      onAlert({ type: 'error', message: err.message });
    }
  };

  const handleDeleteChiBo = (name) => {
    try {
      const updated = deleteChiBo(name);
      setChiBoList(updated);
      setDeletingChiBo(null);
      onAlert({ type: 'success', message: 'Đã xóa chi bộ/đảng bộ!' });
      if (onChiBoChanged) onChiBoChanged();
    } catch (err) {
      onAlert({ type: 'error', message: err.message });
    }
  };

  // ---- Filtered lists ----
  const filteredSteps = steps.filter(s =>
    s.tenQuyTrinh.toLowerCase().includes(stepSearch.toLowerCase())
  );

  const filteredChiBo = chiBoList.filter(cb =>
    cb.toLowerCase().includes(chiBoSearch.toLowerCase())
  );

  return (
    <div className="danhmuc-container">
      {/* Sub Tabs */}
      <div className="danhmuc-subtabs">
        <button
          className={`danhmuc-subtab-btn ${subTab === 'quyTrinh' ? 'active' : ''}`}
          onClick={() => setSubTab('quyTrinh')}
          id="subtab-quytrinh"
        >
          <span className="danhmuc-subtab-icon">📋</span>
          <span>Danh mục Quy trình</span>
          <span className="danhmuc-subtab-count">{steps.length}</span>
        </button>
        <button
          className={`danhmuc-subtab-btn ${subTab === 'chiBo' ? 'active' : ''}`}
          onClick={() => setSubTab('chiBo')}
          id="subtab-chibo"
        >
          <span className="danhmuc-subtab-icon">🏛️</span>
          <span>Chi bộ / Đảng bộ</span>
          <span className="danhmuc-subtab-count">{chiBoList.length}</span>
        </button>
      </div>

      {/* ====== QUY TRÌNH SUB-TAB ====== */}
      {subTab === 'quyTrinh' && (
        <div className="danhmuc-panel">
          <div className="danhmuc-panel-header">
            <div>
              <h3 className="danhmuc-panel-title">Danh mục Bước Quy trình Kết nạp</h3>
              <p className="danhmuc-panel-desc">
                Quản lý các bước quy trình mẫu. Thứ tự và tên bước sẽ được áp dụng khi tạo hồ sơ mới.
              </p>
            </div>
          </div>

          {/* Add form */}
          <div className="danhmuc-add-card">
            <div className="danhmuc-add-card-title">
              <span>➕</span> Thêm bước mới
            </div>
            <form onSubmit={handleAddStep} className="danhmuc-add-form">
              <input
                id="input-new-step"
                type="text"
                className="form-input"
                placeholder="Nhập tên bước quy trình..."
                value={newStepName}
                onChange={(e) => setNewStepName(e.target.value)}
                required
              />
              <button type="submit" className="btn btn-accent" id="btn-add-step">
                Thêm bước
              </button>
            </form>
          </div>

          {/* Search */}
          <div className="toolbar" style={{ marginBottom: '1rem' }}>
            <div className="toolbar-search">
              <span className="toolbar-search-icon">🔍</span>
              <input
                type="text"
                placeholder="Tìm kiếm bước quy trình..."
                value={stepSearch}
                onChange={(e) => setStepSearch(e.target.value)}
              />
            </div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
              {filteredSteps.length} / {steps.length} bước
            </div>
          </div>

          {/* Steps list */}
          {filteredSteps.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📋</div>
              <h3>Không có bước nào</h3>
              <p>Thêm bước quy trình đầu tiên ở trên</p>
            </div>
          ) : (
            <div className="danhmuc-list">
              {filteredSteps.map((step, idx) => (
                <div key={step.soThuTu} className="danhmuc-item">
                  {/* Order controls */}
                  <div className="danhmuc-order-controls">
                    <button
                      className="danhmuc-order-btn"
                      onClick={() => handleMoveStep(step.soThuTu, 'up')}
                      disabled={idx === 0 || stepSearch !== ''}
                      title="Di chuyển lên"
                    >
                      ▲
                    </button>
                    <button
                      className="danhmuc-order-btn"
                      onClick={() => handleMoveStep(step.soThuTu, 'down')}
                      disabled={idx === filteredSteps.length - 1 || stepSearch !== ''}
                      title="Di chuyển xuống"
                    >
                      ▼
                    </button>
                  </div>

                  {/* Step number */}
                  <div className="danhmuc-item-number">{step.soThuTu}</div>

                  {/* Inline edit or display */}
                  {editingStep?.soThuTu === step.soThuTu ? (
                    <form onSubmit={handleSaveStep} className="danhmuc-inline-edit">
                      <input
                        type="text"
                        className="form-input"
                        value={editStepName}
                        onChange={(e) => setEditStepName(e.target.value)}
                        autoFocus
                        required
                        id={`edit-step-${step.soThuTu}`}
                      />
                      <button type="submit" className="btn btn-sm btn-primary">Lưu</button>
                      <button
                        type="button"
                        className="btn btn-sm btn-secondary"
                        onClick={() => setEditingStep(null)}
                      >
                        Hủy
                      </button>
                    </form>
                  ) : (
                    <>
                      <div className="danhmuc-item-name">{step.tenQuyTrinh}</div>
                      <div className="danhmuc-item-actions">
                        <button
                          className="btn btn-sm btn-secondary"
                          onClick={() => handleEditStep(step)}
                          title="Sửa tên"
                          id={`btn-edit-step-${step.soThuTu}`}
                        >
                          ✏️
                        </button>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => setDeletingStep(step)}
                          title="Xóa bước"
                          id={`btn-delete-step-${step.soThuTu}`}
                        >
                          🗑️
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Info note */}
          <div className="danhmuc-info-note">
            <span>ℹ️</span>
            <span>
              Các bước này chỉ áp dụng cho hồ sơ <strong>tạo mới</strong> sau khi cập nhật.
              Hồ sơ đang xử lý không bị thay đổi.
            </span>
          </div>
        </div>
      )}

      {/* ====== CHI BỘ SUB-TAB ====== */}
      {subTab === 'chiBo' && (
        <div className="danhmuc-panel">
          <div className="danhmuc-panel-header">
            <div>
              <h3 className="danhmuc-panel-title">Danh mục Chi bộ / Đảng bộ cơ sở</h3>
              <p className="danhmuc-panel-desc">
                Quản lý danh sách chi bộ, đảng bộ cơ sở. Danh sách này được dùng để phân loại hồ sơ quần chúng.
              </p>
            </div>
          </div>

          {/* Add form */}
          <div className="danhmuc-add-card">
            <div className="danhmuc-add-card-title">
              <span>➕</span> Thêm chi bộ / đảng bộ mới
            </div>
            <form onSubmit={handleAddChiBo} className="danhmuc-add-form">
              <input
                id="input-new-chibo"
                type="text"
                className="form-input"
                placeholder="Ví dụ: Chi bộ Trường THPT Lê Quý Đôn..."
                value={newChiBoName}
                onChange={(e) => setNewChiBoName(e.target.value)}
                required
              />
              <button type="submit" className="btn btn-accent" id="btn-add-chibo">
                Thêm mới
              </button>
            </form>
          </div>

          {/* Search + count */}
          <div className="toolbar" style={{ marginBottom: '1rem' }}>
            <div className="toolbar-search">
              <span className="toolbar-search-icon">🔍</span>
              <input
                type="text"
                placeholder="Tìm kiếm chi bộ, đảng bộ..."
                value={chiBoSearch}
                onChange={(e) => setChiBoSearch(e.target.value)}
              />
            </div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
              {filteredChiBo.length} / {chiBoList.length} đơn vị
            </div>
          </div>

          {/* Chi bo list */}
          {filteredChiBo.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🏛️</div>
              <h3>Không tìm thấy đơn vị nào</h3>
              <p>Thêm chi bộ/đảng bộ đầu tiên ở trên</p>
            </div>
          ) : (
            <div className="danhmuc-list">
              {filteredChiBo.map((cb, idx) => (
                <div key={cb} className="danhmuc-item">
                  {/* Index */}
                  <div className="danhmuc-item-number">{idx + 1}</div>

                  {/* Type badge */}
                  <div className="danhmuc-chibo-type-badge">
                    {cb.startsWith('Đảng bộ') ? (
                      <span className="danhmuc-type-tag danhmuc-type-dangbo">Đảng bộ</span>
                    ) : (
                      <span className="danhmuc-type-tag danhmuc-type-chibo">Chi bộ</span>
                    )}
                  </div>

                  {/* Inline edit or display */}
                  {editingChiBo === cb ? (
                    <form onSubmit={handleSaveChiBo} className="danhmuc-inline-edit">
                      <input
                        type="text"
                        className="form-input"
                        value={editChiBoName}
                        onChange={(e) => setEditChiBoName(e.target.value)}
                        autoFocus
                        required
                        id={`edit-chibo-${idx}`}
                      />
                      <button type="submit" className="btn btn-sm btn-primary">Lưu</button>
                      <button
                        type="button"
                        className="btn btn-sm btn-secondary"
                        onClick={() => setEditingChiBo(null)}
                      >
                        Hủy
                      </button>
                    </form>
                  ) : (
                    <>
                      <div className="danhmuc-item-name">{cb}</div>
                      <div className="danhmuc-item-actions">
                        <button
                          className="btn btn-sm btn-secondary"
                          onClick={() => handleEditChiBo(cb)}
                          title="Sửa tên"
                          id={`btn-edit-chibo-${idx}`}
                        >
                          ✏️
                        </button>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => setDeletingChiBo(cb)}
                          title="Xóa"
                          id={`btn-delete-chibo-${idx}`}
                        >
                          🗑️
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Info note */}
          <div className="danhmuc-info-note">
            <span>ℹ️</span>
            <span>
              Khi đổi tên chi bộ/đảng bộ, tất cả hồ sơ liên quan sẽ được <strong>cập nhật tự động</strong>.
            </span>
          </div>
        </div>
      )}

      {/* ====== DELETE CONFIRM MODALS ====== */}

      {/* Delete Step Modal */}
      {deletingStep && (
        <div className="modal-overlay" onClick={() => setDeletingStep(null)}>
          <div className="modal" style={{ maxWidth: '420px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>⚠️ Xác nhận xóa bước</h3>
              <button className="modal-close" onClick={() => setDeletingStep(null)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ marginBottom: '0.75rem' }}>Bạn có chắc muốn xóa bước này?</p>
              <div className="danhmuc-delete-preview">
                <span className="danhmuc-delete-number">{deletingStep.soThuTu}</span>
                <span>{deletingStep.tenQuyTrinh}</span>
              </div>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: '0.75rem' }}>
                Hành động này không ảnh hưởng đến hồ sơ đang xử lý, chỉ xóa khỏi danh mục mẫu.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeletingStep(null)}>Hủy</button>
              <button
                className="btn btn-danger"
                onClick={() => handleDeleteStep(deletingStep.soThuTu)}
                id="btn-confirm-delete-step"
              >
                Xóa bước
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Chi Bo Modal */}
      {deletingChiBo && (
        <div className="modal-overlay" onClick={() => setDeletingChiBo(null)}>
          <div className="modal" style={{ maxWidth: '420px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>⚠️ Xác nhận xóa đơn vị</h3>
              <button className="modal-close" onClick={() => setDeletingChiBo(null)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ marginBottom: '0.75rem' }}>Bạn có chắc muốn xóa đơn vị này?</p>
              <div className="danhmuc-delete-preview" style={{ justifyContent: 'flex-start', gap: '10px' }}>
                <span>🏛️</span>
                <span style={{ fontWeight: 600 }}>{deletingChiBo}</span>
              </div>
              <div className="alert alert-warning" style={{ marginTop: '0.75rem' }}>
                ⚠️ Các hồ sơ thuộc đơn vị này sẽ <strong>không bị xóa</strong> nhưng sẽ mất liên kết danh mục.
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeletingChiBo(null)}>Hủy</button>
              <button
                className="btn btn-danger"
                onClick={() => handleDeleteChiBo(deletingChiBo)}
                id="btn-confirm-delete-chibo"
              >
                Xóa đơn vị
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
