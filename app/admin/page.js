'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  getAllApplicants,
  getStatistics,
  initializeData,
  getChiBoList,
  syncAllApplicantsWithTemplate,
} from '../lib/store';
import {
  login,
  logout,
  getCurrentUser,
  isAdmin,
  initializeUsers,
  getAdminEmail,
  ROLE_LABELS,
} from '../lib/userStore';

// Tab components
import DashboardTab from '../components/DashboardTab';
import ApplicantTab from '../components/ApplicantTab';
import ProcessesTab from '../components/ProcessesTab';
import DanhMucTab from '../components/DanhMucTab';
import UserManagementTab from '../components/UserManagementTab';
import EmailTemplateTab from '../components/EmailTemplateTab';

// =============================================
// Admin Page — Auth shell + Tab routing
// =============================================
export default function AdminPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [showForgotPwd, setShowForgotPwd] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');

  // Shared data
  const [applicants, setApplicants] = useState([]);
  const [stats, setStats] = useState(null);
  const [chiBoList, setChiBoList] = useState([]);
  const [alert, setAlert] = useState(null);

  // ---- Init ----
  useEffect(() => {
    initializeData();
    initializeUsers();
    syncAllApplicantsWithTemplate(); // đồng bộ hồ sơ cũ với template hiện tại
    const user = getCurrentUser();
    if (user) setCurrentUser(user);
  }, []);

  // ---- Load data ----
  const loadData = useCallback(() => {
    setApplicants(getAllApplicants());
    setStats(getStatistics());
    setChiBoList(getChiBoList());
  }, []);

  useEffect(() => {
    if (currentUser) loadData();
  }, [currentUser, loadData]);

  // ---- Auto-hide alerts ----
  useEffect(() => {
    if (alert) {
      const t = setTimeout(() => setAlert(null), 4000);
      return () => clearTimeout(t);
    }
  }, [alert]);

  const userIsAdmin = isAdmin(currentUser);

  // ---- Auth ----
  const handleLogin = (e) => {
    e.preventDefault();
    const user = login(usernameInput, passwordInput);
    if (user) {
      setCurrentUser(user);
      setLoginError('');
    } else {
      setLoginError('Tên đăng nhập hoặc mật khẩu không đúng, hoặc tài khoản đã bị vô hiệu!');
    }
  };

  const handleLogout = () => {
    logout();
    setCurrentUser(null);
    setUsernameInput('');
    setPasswordInput('');
    setActiveTab('dashboard');
  };

  // ====== LOGIN SCREEN ======
  if (!currentUser) {
    const adminEmail = getAdminEmail();
    return (
      <>
        <header className="header">
          <div className="header-inner">
            <Link href="/" className="header-logo">
              <div className="header-logo-icon">☆</div>
            <div className="header-logo-text">XÂY DỰNG <span>ĐẢNG</span><br /><span className="header-logo-sub">Đảng bộ Phường Chánh Hưng, TP.HCM</span></div>
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

            {loginError && <div className="alert alert-error">⚠️ {loginError}</div>}

            {showForgotPwd ? (
              <div className="forgot-pwd-panel">
                <div className="forgot-pwd-icon">🔑</div>
                <h3>Quên mật khẩu?</h3>
                <p>Vui lòng liên hệ Quản trị viên để được đặt lại mật khẩu.</p>
                {adminEmail && (
                  <div className="forgot-pwd-contact">
                    📧 Email: <a href={`mailto:${adminEmail}`}>{adminEmail}</a>
                  </div>
                )}
                <button
                  className="btn btn-secondary btn-block"
                  onClick={() => setShowForgotPwd(false)}
                  style={{ marginTop: '1rem' }}
                >
                  ← Quay lại đăng nhập
                </button>
              </div>
            ) : (
              <form onSubmit={handleLogin}>
                <div className="form-group">
                  <label htmlFor="login-username">Tên đăng nhập</label>
                  <input id="login-username" type="text" className="form-input"
                    placeholder="Nhập tên đăng nhập" value={usernameInput}
                    onChange={e => setUsernameInput(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label htmlFor="login-password">Mật khẩu</label>
                  <input id="login-password" type="password" className="form-input"
                    placeholder="Nhập mật khẩu" value={passwordInput}
                    onChange={e => setPasswordInput(e.target.value)} required />
                </div>
                <button type="submit" className="btn btn-primary btn-block mt-2">Đăng nhập</button>
                <div className="forgot-pwd-link">
                  <button type="button" onClick={() => setShowForgotPwd(true)} className="link-btn">
                    Quên mật khẩu?
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </>
    );
  }

  // ====== ADMIN DASHBOARD ======
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
            <div className="user-session-badge">
              <div className={`user-avatar user-avatar-${currentUser.role}`}>
                {currentUser.hoTen.charAt(0).toUpperCase()}
              </div>
              <div className="user-session-info">
                <span className="user-session-name">{currentUser.hoTen}</span>
                <span className={`role-badge-sm role-${currentUser.role}`}>
                  {userIsAdmin ? '👑' : '✏️'} {ROLE_LABELS[currentUser.role]}
                </span>
              </div>
            </div>
            <button onClick={handleLogout} className="btn btn-sm btn-danger" style={{ marginLeft: '4px' }}>
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
          <button className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')} id="tab-dashboard">📊 Tổng quan</button>
          <button className={`tab-btn ${activeTab === 'applicants' ? 'active' : ''}`} onClick={() => setActiveTab('applicants')} id="tab-applicants">👥 Quần chúng</button>
          <button className={`tab-btn ${activeTab === 'processes' ? 'active' : ''}`} onClick={() => setActiveTab('processes')} id="tab-processes">📋 Quy trình</button>
          {userIsAdmin && (
            <>
              <button className={`tab-btn ${activeTab === 'danhmuc' ? 'active' : ''}`} onClick={() => setActiveTab('danhmuc')} id="tab-danhmuc">🗂️ Danh mục</button>
              <button className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')} id="tab-users">👤 Thành viên</button>
              <button className={`tab-btn ${activeTab === 'email' ? 'active' : ''}`} onClick={() => setActiveTab('email')} id="tab-email">📧 Email</button>
            </>
          )}
        </div>

        {/* Tab content */}
        {activeTab === 'dashboard' && (
          <DashboardTab applicants={applicants} stats={stats} />
        )}
        {activeTab === 'applicants' && (
          <ApplicantTab
            applicants={applicants}
            chiBoList={chiBoList}
            userIsAdmin={userIsAdmin}
            currentUser={currentUser}
            onAlert={setAlert}
            onReload={loadData}
          />
        )}
        {activeTab === 'processes' && (
          <ProcessesTab
            applicants={applicants}
            userIsAdmin={userIsAdmin}
            currentUser={currentUser}
            onAlert={setAlert}
            onReload={loadData}
          />
        )}
        {activeTab === 'danhmuc' && userIsAdmin && (
          <DanhMucTab onAlert={setAlert} onReload={loadData} />
        )}
        {activeTab === 'users' && userIsAdmin && (
          <UserManagementTab onAlert={setAlert} currentUser={currentUser} />
        )}
        {activeTab === 'email' && userIsAdmin && (
          <EmailTemplateTab onAlert={setAlert} />
        )}

        {/* Footer */}
        <footer style={{ textAlign: 'center', marginTop: '3rem', padding: '1.5rem 0', borderTop: '1px solid var(--color-border)', color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)' }}>
          © 2025 Hệ Thống Quản Lý Quy Trình Kết Nạp Đảng — Trang Quản Trị
        </footer>
      </div>
    </>
  );
}