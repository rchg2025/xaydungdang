'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  getAllUsers,
  addUser,
  updateUser,
  deleteUser,
  resetPassword,
  ROLES,
  ROLE_LABELS,
  SUPERADMIN_USERNAME,
} from '../lib/userStore';

// =============================================
// User Management Tab Component (Admin only)
// =============================================
export default function UserManagementTab({ onAlert, currentUser }) {
  const [users, setUsers] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [deletingUser, setDeletingUser] = useState(null);
  const [resetUser, setResetUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // ---- Form state ----
  const [formData, setFormData] = useState({
    username: '', hoTen: '', email: '', role: ROLES.BIEN_TAP_VIEN, password: '',
  });
  const [resetPwd, setResetPwd] = useState('');

  // ---- Load ----
  const loadUsers = useCallback(() => {
    setUsers(getAllUsers());
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  // Ắn superadmin khỏi danh sách
  const visibleUsers = users.filter((u) => u.username !== SUPERADMIN_USERNAME);

  // ---- Filtered ----
  const filtered = visibleUsers.filter(u => {
    if (!searchTerm) return true;
    const t = searchTerm.toLowerCase();
    return u.hoTen.toLowerCase().includes(t) ||
      u.username.toLowerCase().includes(t) ||
      (u.email || '').toLowerCase().includes(t);
  });

  // ---- Handlers ----
  const handleAdd = (e) => {
    e.preventDefault();
    try {
      addUser(formData);
      loadUsers();
      setShowAddModal(false);
      setFormData({ username: '', hoTen: '', email: '', role: ROLES.BIEN_TAP_VIEN, password: '' });
      onAlert({ type: 'success', message: 'Đã thêm thành viên mới!' });
    } catch (err) {
      onAlert({ type: 'error', message: err.message });
    }
  };

  const handleEdit = (e) => {
    e.preventDefault();
    try {
      updateUser(editingUser.id, {
        hoTen: formData.hoTen,
        email: formData.email,
        role: formData.role,
        // username không cập nhật vì field đã bị khóa
      });
      loadUsers();
      setEditingUser(null);
      onAlert({ type: 'success', message: 'Đã cập nhật thành viên!' });
    } catch (err) {
      onAlert({ type: 'error', message: err.message });
    }
  };

  const handleDelete = () => {
    try {
      deleteUser(deletingUser.id);
      loadUsers();
      setDeletingUser(null);
      onAlert({ type: 'success', message: 'Đã xóa thành viên!' });
    } catch (err) {
      onAlert({ type: 'error', message: err.message });
    }
  };

  const handleReset = (e) => {
    e.preventDefault();
    try {
      resetPassword(resetUser.id, resetPwd);
      setResetUser(null);
      setResetPwd('');
      onAlert({ type: 'success', message: 'Đã đặt lại mật khẩu!' });
    } catch (err) {
      onAlert({ type: 'error', message: err.message });
    }
  };

  const openEdit = (user) => {
    setEditingUser(user);
    setFormData({ username: user.username, hoTen: user.hoTen, email: user.email || '', role: user.role, password: '' });
  };

  const handleToggleActive = (user) => {
    try {
      updateUser(user.id, { active: !user.active });
      loadUsers();
      onAlert({ type: 'success', message: user.active ? 'Đã vô hiệu hóa tài khoản!' : 'Đã kích hoạt tài khoản!' });
    } catch (err) {
      onAlert({ type: 'error', message: err.message });
    }
  };

  return (
    <div className="danhmuc-container">
      {/* Toolbar */}
      <div className="toolbar">
        <div className="toolbar-search">
          <span className="toolbar-search-icon">🔍</span>
          <input
            type="text"
            placeholder="Tìm theo tên, username, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button
          className="btn btn-accent"
          onClick={() => {
            setFormData({ username: '', hoTen: '', email: '', role: ROLES.BIEN_TAP_VIEN, password: '' });
            setShowAddModal(true);
          }}
          id="btn-add-user"
        >
          ＋ Thêm thành viên
        </button>
      </div>

      {/* Users list */}
      <div className="danhmuc-panel" style={{ marginTop: '1rem' }}>
        <div className="danhmuc-panel-header">
          <h3 className="danhmuc-panel-title">Danh sách Thành viên</h3>
          <p className="danhmuc-panel-desc">
            {filtered.length} / {visibleUsers.length} thành viên
          </p>
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">👤</div>
            <h3>Không có thành viên nào</h3>
          </div>
        ) : (
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Họ tên</th>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Vai trò</th>
                  <th>Trạng thái</th>
                  <th>Ngày tạo</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u, i) => (
                  <tr key={u.id} style={{ opacity: u.active ? 1 : 0.5 }}>
                    <td>{i + 1}</td>
                    <td style={{ fontWeight: 600 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div className={`user-avatar user-avatar-${u.role}`}>
                          {u.hoTen.charAt(0).toUpperCase()}
                        </div>
                        {u.hoTen}
                      </div>
                    </td>
                    <td><code>{u.username}</code></td>
                    <td style={{ fontSize: 'var(--text-xs)' }}>{u.email || '—'}</td>
                    <td>
                      <span className={`role-badge role-${u.role}`}>
                        {u.role === ROLES.ADMIN ? '👑' : '✏️'} {ROLE_LABELS[u.role]}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${u.active ? 'status-da_nhan_phan_hoi' : 'status-huy_ho_so'}`}>
                        {u.active ? '✅ Hoạt động' : '⛔ Vô hiệu'}
                      </span>
                    </td>
                    <td style={{ fontSize: 'var(--text-xs)' }}>
                      {new Date(u.ngayTao).toLocaleDateString('vi-VN')}
                    </td>
                    <td>
                      <div className="table-actions">
                        <button
                          className="btn btn-sm btn-secondary"
                          onClick={() => openEdit(u)}
                          title="Sửa thông tin"
                        >
                          ✏️
                        </button>
                        <button
                          className="btn btn-sm btn-secondary"
                          onClick={() => { setResetUser(u); setResetPwd(''); }}
                          title="Đặt lại mật khẩu"
                        >
                          🔑
                        </button>
                        {/* Ẩn nút vô hiệu hóa và xóa với superadmin */}
                        {u.username !== SUPERADMIN_USERNAME && (
                          <button
                            className="btn btn-sm btn-secondary"
                            onClick={() => handleToggleActive(u)}
                            title={u.active ? 'Vô hiệu hóa' : 'Kích hoạt'}
                          >
                            {u.active ? '⛔' : '✅'}
                          </button>
                        )}
                        {u.username !== SUPERADMIN_USERNAME && u.id !== currentUser?.id && (
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => setDeletingUser(u)}
                            title="Xóa"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ====== ADD MODAL ====== */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>➕ Thêm thành viên mới</h3>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>✕</button>
            </div>
            <form onSubmit={handleAdd}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label>Họ tên *</label>
                    <input
                      type="text" className="form-input" required
                      value={formData.hoTen}
                      onChange={(e) => setFormData({ ...formData, hoTen: e.target.value })}
                      placeholder="Nguyễn Văn A"
                    />
                  </div>
                  <div className="form-group">
                    <label>Tên đăng nhập *</label>
                    <input
                      type="text" className="form-input" required
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      placeholder="nguyenvana"
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email" className="form-input"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="email@example.com"
                    />
                  </div>
                  <div className="form-group">
                    <label>Vai trò *</label>
                    <select
                      className="form-select"
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    >
                      <option value={ROLES.BIEN_TAP_VIEN}>✏️ {ROLE_LABELS.bien_tap_vien}</option>
                      <option value={ROLES.ADMIN}>👑 {ROLE_LABELS.admin}</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>Mật khẩu * (tối thiểu 6 ký tự)</label>
                  <input
                    type="password" className="form-input" required minLength={6}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Nhập mật khẩu"
                  />
                </div>

                {/* Role info */}
                <div className="danhmuc-info-note" style={{ marginTop: '1rem' }}>
                  <span>ℹ️</span>
                  <span>
                    <strong>Quản trị viên:</strong> Toàn quyền quản lý hệ thống.{' '}
                    <strong>Biên tập viên:</strong> Thêm quần chúng và cập nhật trạng thái quy trình.
                  </span>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Hủy</button>
                <button type="submit" className="btn btn-primary">Thêm thành viên</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====== EDIT MODAL ====== */}
      {editingUser && (
        <div className="modal-overlay" onClick={() => setEditingUser(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>✏️ Sửa thành viên — {editingUser.hoTen}</h3>
              <button className="modal-close" onClick={() => setEditingUser(null)}>✕</button>
            </div>
            <form onSubmit={handleEdit}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label>Họ tên *</label>
                    <input
                      type="text" className="form-input" required
                      value={formData.hoTen}
                      onChange={(e) => setFormData({ ...formData, hoTen: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Tên đăng nhập</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.username}
                      readOnly
                      style={{ opacity: 0.6, cursor: 'not-allowed', background: 'var(--color-surface)' }}
                      title="Tên đăng nhập không thể chỉnh sửa"
                    />
                    <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                      🔒 Tên đăng nhập không thể thay đổi sau khi tạo.
                    </p>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email" className="form-input"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Vai trò</label>
                    <select
                      className="form-select"
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    >
                      <option value={ROLES.BIEN_TAP_VIEN}>✏️ {ROLE_LABELS.bien_tap_vien}</option>
                      <option value={ROLES.ADMIN}>👑 {ROLE_LABELS.admin}</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setEditingUser(null)}>Hủy</button>
                <button type="submit" className="btn btn-primary">Cập nhật</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====== RESET PASSWORD MODAL ====== */}
      {resetUser && (
        <div className="modal-overlay" onClick={() => setResetUser(null)}>
          <div className="modal" style={{ maxWidth: '420px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🔑 Đặt lại mật khẩu</h3>
              <button className="modal-close" onClick={() => setResetUser(null)}>✕</button>
            </div>
            <form onSubmit={handleReset}>
              <div className="modal-body">
                <p style={{ marginBottom: '0.75rem' }}>
                  Đặt lại mật khẩu cho: <strong>{resetUser.hoTen}</strong> ({resetUser.username})
                </p>
                <div className="form-group">
                  <label>Mật khẩu mới * (tối thiểu 6 ký tự)</label>
                  <input
                    type="password" className="form-input" required minLength={6}
                    value={resetPwd}
                    onChange={(e) => setResetPwd(e.target.value)}
                    placeholder="Nhập mật khẩu mới"
                    autoFocus
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setResetUser(null)}>Hủy</button>
                <button type="submit" className="btn btn-primary">Đặt lại</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====== DELETE MODAL ====== */}
      {deletingUser && (
        <div className="modal-overlay" onClick={() => setDeletingUser(null)}>
          <div className="modal" style={{ maxWidth: '420px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>⚠️ Xác nhận xóa thành viên</h3>
              <button className="modal-close" onClick={() => setDeletingUser(null)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ marginBottom: '0.75rem' }}>Bạn có chắc muốn xóa thành viên:</p>
              <div className="danhmuc-delete-preview">
                <div className={`user-avatar user-avatar-${deletingUser.role}`}>
                  {deletingUser.hoTen.charAt(0).toUpperCase()}
                </div>
                <div>
                  <strong>{deletingUser.hoTen}</strong>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                    @{deletingUser.username} · {ROLE_LABELS[deletingUser.role]}
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeletingUser(null)}>Hủy</button>
              <button className="btn btn-danger" onClick={handleDelete}>Xóa thành viên</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
