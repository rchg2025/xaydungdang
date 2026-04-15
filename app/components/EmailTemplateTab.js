'use client';

import { useState, useEffect } from 'react';
import {
  TEMPLATE_TYPES,
  TEMPLATE_LABELS,
  TEMPLATE_VARIABLES,
  getTemplate,
  saveTemplate,
  resetTemplate,
  processTemplate,
} from '../lib/emailTemplateStore';
import { testEmailConnection } from '../lib/emailService';

// =============================================
// Email Template Tab Component (Admin only)
// =============================================
export default function EmailTemplateTab({ onAlert }) {
  const [activeType, setActiveType] = useState(TEMPLATE_TYPES.KET_NAP);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [testing, setTesting] = useState(false);
  const [showGmailGuide, setShowGmailGuide] = useState(false);

  // ---- Load template ----
  useEffect(() => {
    const tpl = getTemplate(activeType);
    setSubject(tpl.subject);
    setBody(tpl.body);
    setHasChanges(false);
  }, [activeType]);

  // ---- Save template ----
  const handleSave = () => {
    try {
      saveTemplate(activeType, { subject, body });
      setHasChanges(false);
      onAlert({ type: 'success', message: 'Đã lưu template email!' });
    } catch (err) {
      onAlert({ type: 'error', message: err.message });
    }
  };

  // ---- Reset template ----
  const handleReset = () => {
    resetTemplate(activeType);
    const tpl = getTemplate(activeType);
    setSubject(tpl.subject);
    setBody(tpl.body);
    setHasChanges(false);
    onAlert({ type: 'success', message: 'Đã khôi phục template mặc định!' });
  };

  // ---- Test send ----
  const handleTest = async () => {
    if (!testEmail.trim()) {
      onAlert({ type: 'error', message: 'Nhập email test!' });
      return;
    }
    setTesting(true);
    try {
      await testEmailConnection(testEmail.trim());
      onAlert({ type: 'success', message: `✅ Gửi email test thành công đến ${testEmail}! Kiểm tra hộp thư.` });
    } catch (err) {
      onAlert({ type: 'error', message: err.message });
    }
    setTesting(false);
  };

  // ---- Preview data ----
  const previewData = processTemplate(activeType, {
    hoTen: 'Nguyễn Văn An',
    cccd: '079201001234',
    chiBo: 'Chi bộ Trường THPT Nguyễn Trãi',
    buocHienTai: '5',
    tongBuoc: '10',
    nguoiGui: 'Quản trị viên',
  });

  // ---- Insert variable ----
  const insertVar = (varKey) => {
    setBody((prev) => prev + varKey);
    setHasChanges(true);
  };

  return (
    <div className="danhmuc-container">

      {/* ====== GMAIL CONFIG INFO ====== */}
      <div className="danhmuc-panel" style={{ marginBottom: '1.5rem' }}>
        <div className="danhmuc-panel-header">
          <h3 className="danhmuc-panel-title">⚙️ Cấu hình Gmail</h3>
          <p className="danhmuc-panel-desc">
            Hệ thống gửi email trực tiếp qua Gmail. Cấu hình tại biến môi trường của server.
          </p>
        </div>

        {/* Status indicator */}
        <div className="gmail-status-row">
          <div className="gmail-status-item">
            <span className="gmail-status-icon">📧</span>
            <div>
              <div className="gmail-status-label">Giao thức</div>
              <div className="gmail-status-value">Gmail SMTP (Nodemailer)</div>
            </div>
          </div>
          <div className="gmail-status-item">
            <span className="gmail-status-icon">🔒</span>
            <div>
              <div className="gmail-status-label">Bảo mật</div>
              <div className="gmail-status-value">App Password (không lộ MK chính)</div>
            </div>
          </div>
          <div className="gmail-status-item">
            <span className="gmail-status-icon">📨</span>
            <div>
              <div className="gmail-status-label">Giới hạn</div>
              <div className="gmail-status-value">500 email/ngày (miễn phí)</div>
            </div>
          </div>
        </div>

        {/* Guide toggle */}
        <button
          className="btn btn-secondary"
          onClick={() => setShowGmailGuide(!showGmailGuide)}
          style={{ marginTop: '1rem' }}
        >
          {showGmailGuide ? '🔼 Ẩn hướng dẫn' : '📖 Hướng dẫn cài đặt Gmail'}
        </button>

        {showGmailGuide && (
          <div className="gmail-guide">
            <div className="gmail-guide-title">📋 Cách lấy Gmail App Password</div>
            <ol className="gmail-guide-steps">
              <li>
                Truy cập <a href="https://myaccount.google.com/security" target="_blank" rel="noopener noreferrer">myaccount.google.com/security</a>
              </li>
              <li>Bật <strong>Xác minh 2 bước</strong> (nếu chưa bật)</li>
              <li>Tìm mục <strong>"Mật khẩu ứng dụng"</strong> → Tạo mới</li>
              <li>Chọn ứng dụng: <em>Mail</em>, thiết bị: <em>Other</em> → đặt tên → <strong>Tạo</strong></li>
              <li>Sao chép mật khẩu 16 ký tự được tạo</li>
            </ol>
            <div className="gmail-guide-title" style={{ marginTop: '1rem' }}>🖥️ Cài đặt biến môi trường</div>
            <div className="gmail-guide-env">
              <div className="gmail-env-row">
                <span className="gmail-env-key">GMAIL_USER</span>
                <span className="gmail-env-val">your-email@gmail.com</span>
              </div>
              <div className="gmail-env-row">
                <span className="gmail-env-key">GMAIL_APP_PASSWORD</span>
                <span className="gmail-env-val">xxxx xxxx xxxx xxxx</span>
              </div>
            </div>
            <div className="danhmuc-info-note" style={{ marginTop: '0.75rem' }}>
              <span>💡</span>
              <span>
                <strong>Local:</strong> Thêm vào file <code>.env.local</code> trong thư mục dự án. &nbsp;
                <strong>Vercel:</strong> Vào Settings → Environment Variables → thêm 2 biến trên.
              </span>
            </div>
          </div>
        )}

        {/* Test connection */}
        <div className="gmail-test-row">
          <input
            type="email"
            className="form-input"
            style={{ flex: 1, maxWidth: '300px' }}
            placeholder="Nhập email để test..."
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
          />
          <button
            className="btn btn-primary"
            onClick={handleTest}
            disabled={testing}
            id="btn-test-email"
          >
            {testing ? '⏳ Đang gửi...' : '📤 Gửi email test'}
          </button>
        </div>
      </div>

      {/* ====== TEMPLATE EDITOR ====== */}
      <div className="danhmuc-panel">
        <div className="danhmuc-panel-header">
          <h3 className="danhmuc-panel-title">📝 Soạn Template Email</h3>
          <p className="danhmuc-panel-desc">
            Soạn nội dung mẫu cho từng loại thông báo. Dùng biến để tự động điền thông tin quần chúng.
          </p>
        </div>

        {/* Template type tabs */}
        <div className="email-type-tabs">
          {Object.entries(TEMPLATE_TYPES).map(([, type]) => (
            <button
              key={type}
              className={`email-type-btn ${activeType === type ? 'active' : ''}`}
              onClick={() => setActiveType(type)}
            >
              {TEMPLATE_LABELS[type]}
            </button>
          ))}
        </div>

        {/* Variables chips */}
        <div className="email-vars">
          <span className="email-vars-label">Biến có sẵn:</span>
          {TEMPLATE_VARIABLES.map((v) => (
            <button
              key={v.key}
              className="email-var-chip"
              onClick={() => insertVar(v.key)}
              title={`Chèn ${v.label}`}
            >
              {v.key}
            </button>
          ))}
        </div>

        {/* Subject */}
        <div className="form-group" style={{ marginBottom: '1rem' }}>
          <label style={{ fontWeight: 700, fontSize: 'var(--text-sm)' }}>Tiêu đề email</label>
          <input
            type="text"
            className="form-input"
            value={subject}
            onChange={(e) => { setSubject(e.target.value); setHasChanges(true); }}
            placeholder="Tiêu đề email..."
          />
        </div>

        {/* Body */}
        <div className="form-group" style={{ marginBottom: '1rem' }}>
          <label style={{ fontWeight: 700, fontSize: 'var(--text-sm)' }}>Nội dung email</label>
          <textarea
            className="form-input email-body-editor"
            value={body}
            onChange={(e) => { setBody(e.target.value); setHasChanges(true); }}
            placeholder="Nội dung email..."
            rows={10}
          />
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={handleSave} disabled={!hasChanges}>
            💾 Lưu template
          </button>
          <button className="btn btn-secondary" onClick={() => setShowPreview(!showPreview)}>
            {showPreview ? '🔼 Ẩn preview' : '👁️ Xem trước'}
          </button>
          <button className="btn btn-secondary" onClick={handleReset}>
            ↻ Khôi phục mặc định
          </button>
        </div>

        {/* Preview */}
        {showPreview && (
          <div className="email-preview">
            <div className="email-preview-header">
              <span>📧 Xem trước email</span>
              <span className="email-preview-badge">Preview</span>
            </div>
            <div className="email-preview-subject">
              <strong>Tiêu đề:</strong> {previewData.subject}
            </div>
            <div className="email-preview-body">
              {previewData.body.split('\n').map((line, i) => (
                <div key={i}>{line || <br />}</div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
