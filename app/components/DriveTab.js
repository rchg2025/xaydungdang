'use client';
import { useState, useEffect } from 'react';

export default function DriveTab({ onAlert }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  const [formData, setFormData] = useState({
    GDRIVE_CLIENT_EMAIL: '',
    GDRIVE_PRIVATE_KEY: '',
    GDRIVE_FOLDER_ID: '',
  });

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/db/config');
      if (!res.ok) throw new Error('Không thể tải cấu hình');
      const data = await res.json();
      
      const newForm = { ...formData };
      data.forEach(item => {
        if (newForm[item.key] !== undefined) {
          newForm[item.key] = item.value;
        }
      });
      setFormData(newForm);
    } catch (err) {
      onAlert({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/db/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error('Lưu cấu hình thất bại');
      onAlert({ type: 'success', message: 'Lưu cấu hình Google Drive thành công!' });
    } catch (err) {
      onAlert({ type: 'error', message: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      const res = await fetch('/api/drive/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Kết nối thất bại');
      onAlert({ type: 'success', message: 'Kết nối Google Drive thành công! Thư mục hợp lệ.' });
    } catch (err) {
      onAlert({ type: 'error', message: err.message });
    } finally {
      setTesting(false);
    }
  };

  if (loading) return <div className="loading">Đang tải cấu hình...</div>;

  return (
    <div className="tab-pane active" id="pane-drive">
      <div className="card">
        <div className="card-header">
          <h2>📁 Cấu hình Google Team Drive (Upload file)</h2>
        </div>
        <div className="card-body">
          <form onSubmit={handleSave}>
            <div className="form-group">
              <label>Client Email (Email Service Account)</label>
              <input 
                type="email" 
                className="form-input" 
                placeholder="Ví dụ: my-service@my-project.iam.gserviceaccount.com"
                value={formData.GDRIVE_CLIENT_EMAIL}
                onChange={e => setFormData({ ...formData, GDRIVE_CLIENT_EMAIL: e.target.value })}
              />
            </div>
            
            <div className="form-group">
              <label>Private Key (Có thể copy toàn bộ file JSON vào đây)</label>
              <textarea 
                className="form-input" 
                rows="8"
                style={{ fontFamily: 'monospace', fontSize: '13px' }}
                placeholder='{\n  "type": "service_account",\n  "private_key": "-----BEGIN PRIVATE KEY-----\\n...",\n  ...\n}'
                value={formData.GDRIVE_PRIVATE_KEY}
                onChange={e => setFormData({ ...formData, GDRIVE_PRIVATE_KEY: e.target.value })}
              ></textarea>
            </div>

            <div className="form-group">
              <label>Folder ID (Thư mục lưu ảnh/file)</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Ví dụ: 1dDKXJyt8du7UimS8mRtS-7ymjtjKFMWN"
                value={formData.GDRIVE_FOLDER_ID}
                onChange={e => setFormData({ ...formData, GDRIVE_FOLDER_ID: e.target.value })}
              />
            </div>

            <div className="form-actions" style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button type="button" className="btn btn-secondary" onClick={handleTest} disabled={testing}>
                {testing ? 'Đang test...' : '⚡ Test kết nối'}
              </button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Đang lưu...' : '✓ Lưu cấu hình'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
