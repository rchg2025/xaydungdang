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
  findUserByEmail,
  resetPasswordByEmail,
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

  // Forgot password OTP flow
  const [otpStep, setOtpStep] = useState(1); // 1=email, 2=otp, 3=newpwd
  const [fpEmail, setFpEmail] = useState('');
  const [fpOtp, setFpOtp] = useState('');
  const [fpNewPwd, setFpNewPwd] = useState('');
  const [fpConfirmPwd, setFpConfirmPwd] = useState('');
  const [fpLoading, setFpLoading] = useState(false);
  const [fpError, setFpError] = useState('');
  const [fpSuccess, setFpSuccess] = useState('');
  const [fpCountdown, setFpCountdown] = useState(0);
  const [showFpPwd, setShowFpPwd] = useState(false);

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

  // ---- Forgot password handlers ----
  const openForgotPwd = () => {
    setShowForgotPwd(true);
    setOtpStep(1);
    setFpEmail('');
    setFpOtp('');
    setFpNewPwd('');
    setFpConfirmPwd('');
    setFpError('');
    setFpSuccess('');
    setFpCountdown(0);
  };

  const closeForgotPwd = () => {
    setShowForgotPwd(false);
    setFpError('');
    setFpSuccess('');
  };

  // Countdown timer để resend OTP
  const startCountdown = (seconds = 60) => {
    setFpCountdown(seconds);
    const interval = setInterval(() => {
      setFpCountdown((prev) => {
        if (prev <= 1) { clearInterval(interval); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  // Bước 1: Gửi OTP đến email
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setFpError('');
    setFpSuccess('');

    // Kiểm tra email tồn tại trong hệ thống
    const userFound = findUserByEmail(fpEmail);
    if (!userFound) {
      setFpError('Không tìm thấy tài khoản nào liên kết với email này!');
      return;
    }

    setFpLoading(true);
    try {
      const res = await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: fpEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi gửi OTP');
      setFpSuccess(data.message);
      setOtpStep(2);
      startCountdown(60);
    } catch (err) {
      setFpError(err.message);
    } finally {
      setFpLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (fpCountdown > 0) return;
    setFpError('');
    setFpSuccess('');
    setFpLoading(true);
    try {
      const res = await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: fpEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi gửi OTP');
      setFpSuccess('Đã gửi lại mã OTP mới!');
      startCountdown(60);
    } catch (err) {
      setFpError(err.message);
    } finally {
      setFpLoading(false);
    }
  };

  // Bước 2: Xác thực OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setFpError('');
    setFpSuccess('');
    setFpLoading(true);
    try {
      const res = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: fpEmail, otp: fpOtp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi xác thực OTP');
      setFpSuccess(data.message);
      setOtpStep(3);
    } catch (err) {
      setFpError(err.message);
    } finally {
      setFpLoading(false);
    }
  };

  // Bước 3: Đặt mật khẩu mới
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setFpError('');

    if (fpNewPwd.length < 6) {
      setFpError('Mật khẩu phải có ít nhất 6 ký tự!');
      return;
    }
    if (fpNewPwd !== fpConfirmPwd) {
      setFpError('Xác nhận mật khẩu không khớp!');
      return;
    }

    setFpLoading(true);
    try {
      // Xác nhận lần cuối với server
      const res = await fetch('/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: fpEmail, otp: fpOtp, newPassword: fpNewPwd }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi đặt lại mật khẩu');

      // Cập nhật mật khẩu trong localStorage
      resetPasswordByEmail(fpEmail, fpNewPwd);

      setFpSuccess('🎉 Đặt lại mật khẩu thành công! Đang chuyển về trang đăng nhập...');
      setTimeout(() => {
        closeForgotPwd();
      }, 2500);
    } catch (err) {
      setFpError(err.message);
    } finally {
      setFpLoading(false);
    }
  };

  // ====== LOGIN SCREEN ======
  if (!currentUser) {
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

            {showForgotPwd ? (
              /* ======== FORGOT PASSWORD PANEL ======== */
              <div className="forgot-otp-panel">
                {/* Stepper */}
                <div className="otp-stepper">
                  {[1, 2, 3].map((step) => (
                    <div key={step} className={`otp-step ${otpStep === step ? 'active' : ''} ${otpStep > step ? 'done' : ''}`}>
                      <div className="otp-step-circle">
                        {otpStep > step ? '✓' : step}
                      </div>
                      <span className="otp-step-label">
                        {step === 1 ? 'Nhập email' : step === 2 ? 'Xác thực OTP' : 'Mật khẩu mới'}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Messages */}
                {fpError && (
                  <div className="otp-msg otp-msg-error">
                    <span>⚠️</span> {fpError}
                  </div>
                )}
                {fpSuccess && (
                  <div className="otp-msg otp-msg-success">
                    <span>✅</span> {fpSuccess}
                  </div>
                )}

                {/* Bước 1: Nhập email */}
                {otpStep === 1 && (
                  <form onSubmit={handleSendOtp} className="otp-form">
                    <div className="otp-header">
                      <div className="otp-icon">📧</div>
                      <h3>Nhập địa chỉ Email</h3>
                      <p>Nhập email đã đăng ký trong hệ thống để nhận mã xác thực.</p>
                    </div>
                    <div className="form-group">
                      <label htmlFor="fp-email">Địa chỉ Email</label>
                      <input
                        id="fp-email"
                        type="email"
                        className="form-input"
                        placeholder="example@gmail.com"
                        value={fpEmail}
                        onChange={e => setFpEmail(e.target.value)}
                        required
                        autoFocus
                      />
                    </div>
                    <button
                      type="submit"
                      className="btn btn-primary btn-block"
                      disabled={fpLoading}
                    >
                      {fpLoading ? (
                        <span className="otp-loading">⏳ Đang gửi mã OTP...</span>
                      ) : (
                        '📨 Gửi mã OTP'
                      )}
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary btn-block"
                      onClick={closeForgotPwd}
                      style={{ marginTop: '8px' }}
                    >
                      ← Quay lại đăng nhập
                    </button>
                  </form>
                )}

                {/* Bước 2: Nhập mã OTP */}
                {otpStep === 2 && (
                  <form onSubmit={handleVerifyOtp} className="otp-form">
                    <div className="otp-header">
                      <div className="otp-icon">🔢</div>
                      <h3>Nhập mã OTP</h3>
                      <p>
                        Mã xác thực 6 số đã được gửi đến<br />
                        <strong>{fpEmail}</strong>
                      </p>
                    </div>
                    <div className="form-group">
                      <label htmlFor="fp-otp">Mã OTP (6 số)</label>
                      <input
                        id="fp-otp"
                        type="text"
                        inputMode="numeric"
                        className="form-input otp-input-field"
                        placeholder="• • • • • •"
                        maxLength={6}
                        value={fpOtp}
                        onChange={e => setFpOtp(e.target.value.replace(/\D/g, ''))}
                        required
                        autoFocus
                      />
                      <p className="otp-hint">⏱ Mã có hiệu lực trong 5 phút</p>
                    </div>
                    <button
                      type="submit"
                      className="btn btn-primary btn-block"
                      disabled={fpLoading || fpOtp.length !== 6}
                    >
                      {fpLoading ? (
                        <span className="otp-loading">⏳ Đang xác thực...</span>
                      ) : (
                        '✅ Xác nhận mã OTP'
                      )}
                    </button>
                    <div className="otp-resend">
                      Chưa nhận được mã?{' '}
                      <button
                        type="button"
                        className="link-btn"
                        onClick={handleResendOtp}
                        disabled={fpCountdown > 0 || fpLoading}
                      >
                        {fpCountdown > 0 ? `Gửi lại sau ${fpCountdown}s` : 'Gửi lại OTP'}
                      </button>
                    </div>
                    <button
                      type="button"
                      className="btn btn-secondary btn-block"
                      onClick={() => { setOtpStep(1); setFpOtp(''); setFpError(''); setFpSuccess(''); }}
                      style={{ marginTop: '8px' }}
                    >
                      ← Đổi email khác
                    </button>
                  </form>
                )}

                {/* Bước 3: Đặt mật khẩu mới */}
                {otpStep === 3 && (
                  <form onSubmit={handleResetPassword} className="otp-form">
                    <div className="otp-header">
                      <div className="otp-icon">🔒</div>
                      <h3>Đặt mật khẩu mới</h3>
                      <p>Tạo mật khẩu mới cho tài khoản của bạn.</p>
                    </div>
                    <div className="form-group">
                      <label htmlFor="fp-newpwd">Mật khẩu mới</label>
                      <div className="pwd-input-wrap">
                        <input
                          id="fp-newpwd"
                          type={showFpPwd ? 'text' : 'password'}
                          className="form-input"
                          placeholder="Ít nhất 6 ký tự"
                          value={fpNewPwd}
                          onChange={e => setFpNewPwd(e.target.value)}
                          required
                          autoFocus
                          minLength={6}
                        />
                        <button
                          type="button"
                          className="pwd-toggle-btn"
                          onClick={() => setShowFpPwd(v => !v)}
                          tabIndex={-1}
                        >
                          {showFpPwd ? '🙈' : '👁️'}
                        </button>
                      </div>
                    </div>
                    <div className="form-group">
                      <label htmlFor="fp-confirmpwd">Xác nhận mật khẩu</label>
                      <div className="pwd-input-wrap">
                        <input
                          id="fp-confirmpwd"
                          type={showFpPwd ? 'text' : 'password'}
                          className="form-input"
                          placeholder="Nhập lại mật khẩu"
                          value={fpConfirmPwd}
                          onChange={e => setFpConfirmPwd(e.target.value)}
                          required
                          minLength={6}
                        />
                      </div>
                      {fpNewPwd && fpConfirmPwd && fpNewPwd !== fpConfirmPwd && (
                        <p className="pwd-mismatch">⚠️ Mật khẩu không khớp</p>
                      )}
                      {fpNewPwd && fpConfirmPwd && fpNewPwd === fpConfirmPwd && fpNewPwd.length >= 6 && (
                        <p className="pwd-match">✅ Mật khẩu khớp</p>
                      )}
                    </div>
                    <button
                      type="submit"
                      className="btn btn-primary btn-block"
                      disabled={fpLoading || fpNewPwd.length < 6 || fpNewPwd !== fpConfirmPwd}
                    >
                      {fpLoading ? (
                        <span className="otp-loading">⏳ Đang cập nhật...</span>
                      ) : (
                        '🔐 Đặt lại mật khẩu'
                      )}
                    </button>
                  </form>
                )}
              </div>
            ) : (
              /* ======== LOGIN FORM ======== */
              <>
                <div className="admin-login-icon">🔐</div>
                <h2>Đăng nhập Quản trị</h2>
                <p>Nhập thông tin đăng nhập để truy cập trang quản trị</p>

                {loginError && <div className="alert alert-error">⚠️ {loginError}</div>}

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
                    <button type="button" onClick={openForgotPwd} className="link-btn">
                      Quên mật khẩu?
                    </button>
                  </div>
                </form>
              </>
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
          © 2025 Xây dựng Đảng — Đảng bộ Phường Chánh Hưng. Phát triển bởi <a href="https://rongcon.net" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-accent)' }}>Rồng Con HG</a>
        </footer>
      </div>
    </>
  );
}