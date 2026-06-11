'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  fetchUsers,
  createUser,
  updateUserAPI,
  deleteUserAPI,
  ROLES,
  ROLE_LABELS,
  SUPERADMIN_USERNAME,
} from '../lib/apiClient';
import { exportUsersToXlsx, exportImportTemplateUser, parseXlsxFileUser } from '../lib/excelUtils';

// =============================================
// User Management Tab Component (Admin only)
// =============================================
export default function UserManagementTab({ onAlert, currentUser, chiBoList = [] }) {
  const [users, setUsers] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [deletingUser, setDeletingUser] = useState(null);
  const [resetUser, setResetUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // ---- Excel Import State ----
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importData, setImportData] = useState([]);
  const [importErrors, setImportErrors] = useState([]);
  const [importLoading, setImportLoading] = useState(false);
  const [importSuccess, setImportSuccess] = useState(0);
  const [importFailed, setImportFailed] = useState(0);

  // ---- Form state ----
  const [formData, setFormData] = useState({
    username: '', hoTen: '', email: '', role: ROLES.BIEN_TAP_VIEN, password: '', chiBoDangBo: '',
  });
  const [resetPwd, setResetPwd] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleAvatarChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  // ---- Load ----
  const loadUsers = useCallback(async () => {
    try {
      setUsers(await fetchUsers());
    } catch (err) { console.error(err); }
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  // Ẩn superadmin khỏi danh sách — trừ khi chính tài khoản qtv đang đăng nhập
  const visibleUsers = users
    .filter((u) => u.username !== SUPERADMIN_USERNAME || currentUser?.username === SUPERADMIN_USERNAME)
    .sort((a, b) => new Date(b.ngayTao) - new Date(a.ngayTao));

  // ---- Filtered ----
  const filtered = visibleUsers.filter(u => {
    if (!searchTerm) return true;
    const t = searchTerm.toLowerCase();
    return u.hoTen.toLowerCase().includes(t) ||
      u.username.toLowerCase().includes(t) ||
      (u.email || '').toLowerCase().includes(t);
  });

  // ---- Excel Handlers ----
  const handleExportList = async () => {
    try {
      await exportUsersToXlsx(filtered);
      onAlert({ type: 'success', message: 'Đã xuất file Excel danh sách thành viên!' });
    } catch (err) {
      onAlert({ type: 'error', message: err.message });
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      await exportImportTemplateUser('');
      onAlert({ type: 'success', message: 'Đã tải file mẫu nhập liệu!' });
    } catch (err) {
      onAlert({ type: 'error', message: err.message });
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImportFile(file);
    try {
      const { data, errors } = await parseXlsxFileUser(file);
      setImportData(data);
      setImportErrors(errors);
      setImportSuccess(0);
      setImportFailed(0);
    } catch (err) {
      onAlert({ type: 'error', message: err.message });
      setImportFile(null);
    }
    e.target.value = '';
  };

  const closeImport = () => {
    if (importLoading) return;
    setShowImportModal(false);
    setImportFile(null);
    setImportData([]);
    setImportErrors([]);
    setImportSuccess(0);
    setImportFailed(0);
  };

  const executeImport = async () => {
    if (importData.length === 0) return;
    setImportLoading(true);
    let successCount = 0;
    let failCount = 0;

    for (const row of importData) {
      try {
        await createUser({
          hoTen: row.hoTen,
          username: row.username,
          password: row.password,
          email: row.email,
          role: row.role,
          chiBoDangBo: row.chiBoDangBo
        });
        successCount++;
        
        // Gửi email
        if (row.email) {
          try {
            const loginUrl = window.location.origin;
            await fetch('/api/send-email', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                to: row.email.trim(),
                toName: row.hoTen,
                subject: 'THÔNG BÁO TẠO TÀI KHOẢN MỚI - HỆ THỐNG XÂY DỰNG ĐẢNG',
                message: `Kính gửi ${row.hoTen},

Tài khoản truy cập Hệ thống Quản lý và Tiếp nhận hồ sơ Xây dựng Đảng của bạn đã được tạo thành công.

Dưới đây là thông tin đăng nhập của bạn:
- Tên đăng nhập: ${row.username}
- Mật khẩu: ${row.password}
- Vai trò: ${ROLE_LABELS[row.role] || row.role}
${row.chiBoDangBo ? `- Chi bộ/Đảng bộ quản lý: ${row.chiBoDangBo}\n` : ''}- Đường dẫn truy cập: ${loginUrl}

Vui lòng đăng nhập vào hệ thống để bắt đầu công việc. (Bạn có thể đổi mật khẩu nếu cần thiết).

Trân trọng,
Quản trị viên Hệ thống`
              })
            });
          } catch (emailErr) {
            console.error("Lỗi gửi email tạo tài khoản import:", emailErr);
          }
        }
      } catch (err) {
        failCount++;
        setImportErrors(prev => [...prev, `Lỗi tạo "${row.username}": ${err.message}`]);
      }
    }

    setImportSuccess(successCount);
    setImportFailed(failCount);
    setImportLoading(false);
    await loadUsers();
    
    if (failCount === 0) {
      onAlert({ type: 'success', message: `Đã nhập thành công ${successCount} thành viên!` });
    } else {
      onAlert({ type: 'warning', message: `Nhập xong: ${successCount} thành công, ${failCount} lỗi.` });
    }
  };

  // ---- Handlers ----
  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await createUser(formData);

      // Gửi email thông báo tài khoản
      if (formData.email) {
        try {
          const loginUrl = window.location.origin;
          await fetch('/api/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: formData.email.trim(),
              toName: formData.hoTen,
              subject: 'THÔNG BÁO TẠO TÀI KHOẢN MỚI - HỆ THỐNG XÂY DỰNG ĐẢNG',
              message: `Kính gửi ${formData.hoTen},

Tài khoản truy cập Hệ thống Quản lý và Tiếp nhận hồ sơ Xây dựng Đảng của bạn đã được tạo thành công.

Dưới đây là thông tin đăng nhập của bạn:
- Tên đăng nhập: ${formData.username}
- Mật khẩu: ${formData.password}
- Vai trò: ${ROLE_LABELS[formData.role]}
${formData.chiBoDangBo ? `- Chi bộ/Đảng bộ quản lý: ${formData.chiBoDangBo}\n` : ''}- Đường dẫn truy cập: ${loginUrl}

Vui lòng đăng nhập vào hệ thống để bắt đầu công việc. (Bạn có thể đổi mật khẩu nếu cần thiết).

Trân trọng,
Quản trị viên Hệ thống`
            })
          });
        } catch (emailErr) {
          console.error("Lỗi gửi email tạo tài khoản:", emailErr);
        }
      }

      await loadUsers();
      setShowAddModal(false);
      setFormData({ username: '', hoTen: '', email: '', role: ROLES.BIEN_TAP_VIEN, password: '', chiBoDangBo: '' });
      onAlert({ type: 'success', message: 'Đã thêm thành viên mới!' });
    } catch (err) {
      onAlert({ type: 'error', message: err.message });
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    setIsUploading(true);
    try {
      let finalAvatarId = formData.avatar;
      
      if (avatarFile) {
        const uploadFormData = new FormData();
        uploadFormData.append('file', avatarFile);
        const uploadRes = await fetch('/api/drive/upload', {
          method: 'POST',
          body: uploadFormData
        });
        if (!uploadRes.ok) {
           const err = await uploadRes.json();
           throw new Error(err.error || 'Upload ảnh thất bại');
        }
        const data = await uploadRes.json();
        finalAvatarId = data.fileId;
      }

      await updateUserAPI(editingUser.id, {
        hoTen: formData.hoTen,
        email: formData.email,
        soDienThoai: formData.soDienThoai,
        avatar: finalAvatarId,
        role: formData.role,
        chiBoDangBo: formData.role === ROLES.THANH_VIEN ? formData.chiBoDangBo : '',
      });
      await loadUsers();
      setEditingUser(null);
      onAlert({ type: 'success', message: 'Đã cập nhật thành viên!' });
    } catch (err) {
      onAlert({ type: 'error', message: err.message });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteUserAPI(deletingUser.id);
      await loadUsers();
      setDeletingUser(null);
      onAlert({ type: 'success', message: 'Đã xóa thành viên!' });
    } catch (err) {
      onAlert({ type: 'error', message: err.message });
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    try {
      await updateUserAPI(resetUser.id, { password: resetPwd });
      setResetUser(null);
      setResetPwd('');
      onAlert({ type: 'success', message: 'Đã đặt lại mật khẩu!' });
    } catch (err) {
      onAlert({ type: 'error', message: err.message });
    }
  };

  const openEdit = (user) => {
    setEditingUser(user);
    setFormData({ username: user.username, hoTen: user.hoTen, email: user.email || '', role: user.role, password: '', chiBoDangBo: user.chiBoDangBo || '', soDienThoai: user.soDienThoai || '', avatar: user.avatar || '' });
    setAvatarFile(null);
    setAvatarPreview(null);
  };

  const handleToggleActive = async (user) => {
    try {
      await updateUserAPI(user.id, { active: !user.active });
      await loadUsers();
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
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" onClick={handleDownloadTemplate} title="Tải mẫu Excel trống">⬇️ Tải mẫu</button>
          <button className="btn btn-secondary" onClick={() => setShowImportModal(true)} title="Nhập danh sách từ Excel">📥 Nhập Excel</button>
          <button className="btn btn-secondary" onClick={handleExportList} title="Xuất danh sách ra Excel">📤 Xuất Excel</button>
          <button
            className="btn btn-accent"
            onClick={() => {
              setFormData({ username: '', hoTen: '', email: '', role: ROLES.BIEN_TAP_VIEN, password: '', chiBoDangBo: '' });
              setShowAddModal(true);
            }}
            id="btn-add-user"
          >
            ＋ Thêm thành viên
          </button>
        </div>
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
                    <td style={{ fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }} onClick={() => openEdit(u)} title="Xem / Sửa hồ sơ" className="hover-text-primary">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div className={`user-avatar user-avatar-${u.role}`} style={{ overflow: 'hidden' }}>
                          {u.avatar ? (
                            <img src={`/api/drive/image/${u.avatar}`} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            (u.hoTen || u.username || 'U').charAt(0).toUpperCase()
                          )}
                        </div>
                        <span style={{ textDecoration: 'underline', textDecorationColor: 'transparent' }} onMouseOver={e => e.target.style.textDecorationColor = 'currentColor'} onMouseOut={e => e.target.style.textDecorationColor = 'transparent'}>
                          {u.hoTen}
                        </span>
                      </div>
                    </td>
                    <td><code>{u.username}</code></td>
                    <td style={{ fontSize: 'var(--text-xs)' }}>{u.email || '—'}</td>
                    <td>
                      <span className={`role-badge role-${u.role}`}>
                        {u.role === ROLES.ADMIN ? '👑' : (u.role === ROLES.THANH_VIEN ? '👤' : '✏️')} {ROLE_LABELS[u.role]}
                      </span>
                      {u.role === ROLES.THANH_VIEN && u.chiBoDangBo && (
                        <div style={{ fontSize: '11px', marginTop: '4px', color: 'var(--color-accent)' }}>
                          {u.chiBoDangBo}
                        </div>
                      )}
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
                        {/* Ẩn nút vô hiệu hóa và xóa của qtv với người dùng khác */}
                        {(u.username !== SUPERADMIN_USERNAME || currentUser?.username === SUPERADMIN_USERNAME) && (
                          <button
                            className="btn btn-sm btn-secondary"
                            onClick={() => handleToggleActive(u)}
                            title={u.active ? 'Vô hiệu hóa' : 'Kích hoạt'}
                          >
                            {u.active ? '⛔' : '✅'}
                          </button>
                        )}
                        {(u.username !== SUPERADMIN_USERNAME || currentUser?.username === SUPERADMIN_USERNAME) && u.id !== currentUser?.id && (
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
        <div className="modal-overlay">
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
                      <option value={ROLES.THANH_VIEN}>👤 {ROLE_LABELS.thanh_vien}</option>
                      <option value={ROLES.ADMIN}>👑 {ROLE_LABELS.admin}</option>
                    </select>
                  </div>
                </div>
                {formData.role === ROLES.THANH_VIEN && (
                  <div className="form-group">
                    <label>Chi bộ / Đảng bộ quản lý *</label>
                    <select
                      className="form-select" required
                      value={formData.chiBoDangBo}
                      onChange={(e) => setFormData({ ...formData, chiBoDangBo: e.target.value })}
                    >
                      <option value="">-- Chọn Chi bộ / Đảng bộ --</option>
                      {chiBoList.map(cb => (
                        <option key={cb.ten} value={cb.ten}>{cb.ten}</option>
                      ))}
                    </select>
                  </div>
                )}
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
                    <strong>Biên tập viên:</strong> Quản lý toàn bộ hồ sơ.{' '}
                    <strong>Thành viên:</strong> Chỉ quản lý hồ sơ thuộc Chi bộ/Đảng bộ được phân công.
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
        <div className="modal-overlay">
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>✏️ Sửa thành viên — {editingUser.hoTen}</h3>
              <button className="modal-close" onClick={() => setEditingUser(null)}>✕</button>
            </div>
            <form onSubmit={handleEdit}>
              <div className="modal-body">
                <div className="form-group" style={{ textAlign: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                    <div className={`user-avatar user-avatar-${editingUser.role}`} style={{ width: '80px', height: '80px', fontSize: '32px', margin: '0 auto', overflow: 'hidden', background: 'var(--color-bg-secondary)' }}>
                      {avatarPreview ? (
                        <img src={avatarPreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : formData.avatar ? (
                        <img src={`/api/drive/image/${formData.avatar}`} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        (editingUser.hoTen || editingUser.username || 'U').charAt(0).toUpperCase()
                      )}
                    </div>
                    <input type="file" accept="image/*" onChange={handleAvatarChange} style={{ fontSize: '12px' }} />
                  </div>
                </div>
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
                    <label>Số điện thoại</label>
                    <input
                      type="tel" className="form-input"
                      value={formData.soDienThoai || ''}
                      onChange={(e) => setFormData({ ...formData, soDienThoai: e.target.value })}
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Vai trò</label>
                    <select
                      className="form-select"
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    >
                      <option value={ROLES.BIEN_TAP_VIEN}>✏️ {ROLE_LABELS.bien_tap_vien}</option>
                      <option value={ROLES.THANH_VIEN}>👤 {ROLE_LABELS.thanh_vien}</option>
                      <option value={ROLES.ADMIN}>👑 {ROLE_LABELS.admin}</option>
                    </select>
                  </div>
                </div>
                {formData.role === ROLES.THANH_VIEN && (
                  <div className="form-group">
                    <label>Chi bộ / Đảng bộ quản lý *</label>
                    <select
                      className="form-select" required
                      value={formData.chiBoDangBo}
                      onChange={(e) => setFormData({ ...formData, chiBoDangBo: e.target.value })}
                    >
                      <option value="">-- Chọn Chi bộ / Đảng bộ --</option>
                      {chiBoList.map(cb => (
                        <option key={cb.ten} value={cb.ten}>{cb.ten}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setEditingUser(null)}>Hủy</button>
                <button type="submit" className="btn btn-primary" disabled={isUploading}>
                  {isUploading ? 'Đang cập nhật...' : 'Cập nhật'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====== RESET PASSWORD MODAL ====== */}
      {resetUser && (
        <div className="modal-overlay">
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
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '420px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>⚠️ Xác nhận xóa thành viên</h3>
              <button className="modal-close" onClick={() => setDeletingUser(null)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ marginBottom: '0.75rem' }}>Bạn có chắc muốn xóa thành viên:</p>
              <div className="danhmuc-delete-preview">
                <div className={`user-avatar user-avatar-${deletingUser.role}`} style={{ width: '64px', height: '64px', fontSize: '28px', margin: '0 auto 1rem auto', overflow: 'hidden' }}>
                  {deletingUser.avatar ? (
                    <img src={`/api/drive/image/${deletingUser.avatar}`} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    (deletingUser.hoTen || deletingUser.username || 'U').charAt(0).toUpperCase()
                  )}
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

      {/* ====== IMPORT MODAL ====== */}
      {showImportModal && (
        <div className="modal-overlay">
          <div className="modal modal-wide" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📥 Nhập danh sách Thành viên từ Excel</h3>
              {!importLoading && <button className="modal-close" onClick={closeImport}>✕</button>}
            </div>
            <div className="modal-body">
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
                Vui lòng tải <a href="#" onClick={(e) => { e.preventDefault(); handleDownloadTemplate(); }} style={{ color: 'var(--color-accent)' }}>file mẫu</a>, điền thông tin và upload file (<b>.xlsx</b>).
              </p>
              
              <input
                type="file"
                accept=".xlsx, .xls"
                onChange={handleFileChange}
                disabled={importLoading}
                style={{ marginBottom: '1rem' }}
              />

              {importFile && (
                <div style={{ padding: '1rem', background: 'var(--color-bg-secondary)', borderRadius: '8px', marginBottom: '1rem' }}>
                  <h4 style={{ margin: '0 0 8px 0' }}>Dữ liệu hợp lệ: <span style={{ color: 'var(--color-success)' }}>{importData.length}</span></h4>
                  {importData.length > 0 && (
                    <div style={{ maxHeight: '150px', overflowY: 'auto', fontSize: 'var(--text-xs)' }}>
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Họ tên</th>
                            <th>Username</th>
                            <th>Vai trò</th>
                          </tr>
                        </thead>
                        <tbody>
                          {importData.slice(0, 5).map((r, i) => (
                            <tr key={i}>
                              <td>{r.hoTen}</td>
                              <td>{r.username}</td>
                              <td>{ROLE_LABELS[r.role] || r.role}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {importData.length > 5 && <div style={{ textAlign: 'center', padding: '4px', color: 'var(--color-text-muted)' }}>... và {importData.length - 5} thành viên khác</div>}
                    </div>
                  )}

                  <h4 style={{ margin: '16px 0 8px 0', color: importErrors.length > 0 ? 'var(--color-danger)' : 'var(--color-success)' }}>
                    Lỗi dữ liệu: {importErrors.length}
                  </h4>
                  {importErrors.length > 0 && (
                    <div style={{ maxHeight: '150px', overflowY: 'auto', fontSize: 'var(--text-xs)', color: 'var(--color-danger)', background: 'var(--color-danger-muted)', padding: '8px', borderRadius: '4px' }}>
                      <ul style={{ margin: 0, paddingLeft: '20px' }}>
                        {importErrors.map((err, i) => <li key={i} style={{ marginBottom: '4px' }}>{err}</li>)}
                      </ul>
                    </div>
                  )}
                  
                  {(importSuccess > 0 || importFailed > 0) && (
                    <div style={{ marginTop: '16px', padding: '12px', background: 'var(--color-bg-alt)', borderRadius: '8px' }}>
                      <p style={{ margin: '0 0 4px 0', fontWeight: 'bold' }}>Kết quả thực thi:</p>
                      <p style={{ margin: 0, color: 'var(--color-success)' }}>✅ Thành công: {importSuccess}</p>
                      <p style={{ margin: 0, color: 'var(--color-danger)' }}>❌ Thất bại: {importFailed}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={closeImport} disabled={importLoading}>Đóng</button>
              {importData.length > 0 && (
                <button type="button" className="btn btn-primary" onClick={executeImport} disabled={importLoading}>
                  {importLoading ? 'Đang xử lý...' : `Tiến hành nhập (${importData.length})`}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
