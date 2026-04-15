'use client';

import { useState, useEffect } from 'react';
import {
  TEMPLATE_TYPES,
  TEMPLATE_LABELS,
  TEMPLATE_VARIABLES,
  getTemplates,
  getTemplate,
  saveTemplate,
  resetTemplate,
  getEmailJSConfig,
  saveEmailJSConfig,
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

  // EmailJS config
  const [config, setConfig] = useState({ serviceId: '', templateId: '', publicKey: '' });
  const [testEmail, setTestEmail] = useState('');
  const [testing, setTesting] = useState(false);

  // ---- Load template ----
  useEffect(() => {
    const tpl = getTemplate(activeType);
    setSubject(tpl.subject);
    setBody(tpl.body);
    setHasChanges(false);
  }, [activeType]);

  // ---- Load EmailJS config ----
  useEffect(() => {
    setConfig(getEmailJSConfig());
  }, []);

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

  // ---- Save EmailJS config ----
  const handleSaveConfig = () => {
    saveEmailJSConfig(config);
    onAlert({ type: 'success', message: 'Đã lưu cấu hình EmailJS!' });
  };

  // ---- Test ----
  const handleTest = async () => {
    if (!testEmail.trim()) {
      onAlert({ type: 'error', message: 'Nhập email test!' });
      return;
    }
    setTesting(true);
    try {
      await testEmailConnection(testEmail.trim());
      onAlert({ type: 'success', message: 'Gửi email test thành công! Kiểm tra hộp thư.' });
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
      {/* ====== EMAILJS CONFIG ====== */}
      <div className="danhmuc-panel" style={{ marginBottom: '1.5rem' }}>
        <div className="danhmuc-panel-header">
          <h3 className="danhmuc-panel-title">⚙️ Cấu hình EmailJS</h3>
          <p className="danhmuc-panel-desc">
            Kết nối với <a href="https://www.emailjs.com/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-accent)' }}>EmailJS</a> để gửi email thông báo thật.
            Tạo tài khoản miễn phí (200 email/tháng).
          </p>
        </div>

        <div className="email-config-grid">
          <div className="form-group">
            <label>Service ID</label>
            <input
              type="text" className="form-input"
              placeholder="service_xxxxxxx"
              value={config.serviceId}
              onChange={(e) => setConfig({ ...config, serviceId: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Template ID</label>
            <input
              type="text" className="form-input"
              placeholder="template_xxxxxxx"
              value={config.templateId}
              onChange={(e) => setConfig({ ...config, templateId: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Public Key</label>
            <input
              type="text" className="form-input"
              placeholder="xxxxxxxxxxxxxx"
              value={config.publicKey}
              onChange={(e) => setConfig({ ...config, publicKey: e.target.value })}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '1rem' }}>
          <button className="btn btn-primary" onClick={handleSaveConfig}>
            💾 Lưu cấu hình
          </button>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flex: 1 }}>
            <input
              type="email" className="form-input" style={{ maxWidth: '250px' }}
              placeholder="Email test..."
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
            />
            <button
              className="btn btn-secondary"
              onClick={handleTest}
              disabled={testing}
            >
              {testing ? '⏳ Đang gửi...' : '📧 Test'}
            </button>
          </div>
        </div>

        <div className="danhmuc-info-note" style={{ marginTop: '0.75rem' }}>
          <span>ℹ️</span>
          <span>
            <strong>Hướng dẫn:</strong> Đăng ký tại emailjs.com → tạo Service (Gmail/Outlook) → tạo Template với các biến:
            <code style={{ margin: '0 4px' }}>{'{{to_email}}'}</code>
            <code style={{ margin: '0 4px' }}>{'{{to_name}}'}</code>
            <code style={{ margin: '0 4px' }}>{'{{subject}}'}</code>
            <code style={{ margin: '0 4px' }}>{'{{message}}'}</code>
          </span>
        </div>
      </div>

      {/* ====== TEMPLATE EDITOR ====== */}
      <div className="danhmuc-panel">
        <div className="danhmuc-panel-header">
          <h3 className="danhmuc-panel-title">📝 Soạn Template Email</h3>
          <p className="danhmuc-panel-desc">
            Chọn loại thông báo và soạn nội dung. Sử dụng biến để tự động điền thông tin.
          </p>
        </div>

        {/* Template type tabs */}
        <div className="email-type-tabs">
          {Object.entries(TEMPLATE_TYPES).map(([key, type]) => (
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
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={!hasChanges}
          >
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
