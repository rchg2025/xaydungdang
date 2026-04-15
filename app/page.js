'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ProcessTimeline from './components/ProcessTimeline';
import { searchApplicants, initializeData, getCurrentStep } from './lib/store';

export default function HomePage() {
  const [cccd, setCccd] = useState('');
  const [chiBo, setChiBo] = useState('');
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    initializeData();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!cccd.trim() && !chiBo.trim()) return;
    setIsSearching(true);
    setTimeout(() => {
      const found = searchApplicants(cccd, chiBo);
      setResults(found);
      setSearched(true);
      setExpandedId(found.length === 1 ? found[0].id : null);
      setIsSearching(false);
    }, 400);
  };

  const handleReset = () => {
    setCccd('');
    setChiBo('');
    setResults([]);
    setSearched(false);
    setExpandedId(null);
  };

  const getProgressPercent = (applicant) => {
    const completed = applicant.quyTrinh.filter(s => s.trangThai === 'da_nhan_phan_hoi').length;
    return Math.round((completed / applicant.quyTrinh.length) * 100);
  };

  return (
    <>
      {/* Header */}
      <header className="header">
        <div className="header-inner">
          <Link href="/" className="header-logo">
            <div className="header-logo-icon">☆</div>
            <div className="header-logo-text">
              XÂY DỰNG <span>ĐẢNG</span>
            </div>
          </Link>
          <nav className="header-nav">
            <Link href="/" className="header-nav-link active">🔍 Tra cứu</Link>
            <Link href="/admin" className="header-nav-link">🔐 Quản trị</Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="hero">
        <div className="hero-badge">
          <span className="hero-badge-dot"></span>
          Hệ thống tra cứu trực tuyến
        </div>
        <h1>
          Tra cứu<br />
          <span className="gradient-text">Quy trình Kết nạp Đảng</span>
        </h1>
        <p>
          Tra cứu nhanh tiến độ quy trình kết nạp Đảng viên bằng số CCCD hoặc Chi bộ/Đảng bộ cơ sở
        </p>
      </section>

      {/* Search */}
      <section className="search-section">
        <form onSubmit={handleSearch} className="search-card">
          <div className="search-fields">
            <div className="search-field">
              <label htmlFor="search-cccd">Số CCCD</label>
              <div className="search-input-wrap">
                <span className="search-input-icon">🪪</span>
                <input
                  id="search-cccd"
                  type="text"
                  placeholder="Nhập số CCCD (12 số)..."
                  value={cccd}
                  onChange={(e) => setCccd(e.target.value)}
                  maxLength={12}
                />
                {cccd && (
                  <button
                    type="button"
                    className="search-clear-field-btn"
                    onClick={() => setCccd('')}
                    title="Xóa"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
            <div className="search-field">
              <label htmlFor="search-chibo">Chi bộ / Đảng bộ</label>
              <div className="search-input-wrap">
                <span className="search-input-icon">🏛️</span>
                <input
                  id="search-chibo"
                  type="text"
                  placeholder="Nhập tên chi bộ..."
                  value={chiBo}
                  onChange={(e) => setChiBo(e.target.value)}
                />
                {chiBo && (
                  <button
                    type="button"
                    className="search-clear-field-btn"
                    onClick={() => setChiBo('')}
                    title="Xóa"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="search-actions">
            <button
              type="submit"
              className="search-btn-primary"
              disabled={isSearching || (!cccd.trim() && !chiBo.trim())}
              id="btn-search"
            >
              {isSearching ? (
                <>
                  <span className="search-spinner" />
                  Đang tìm...
                </>
              ) : (
                <>
                  <span className="search-btn-icon">🔍</span>
                  Tra cứu
                </>
              )}
            </button>

            {searched && (
              <button
                type="button"
                onClick={handleReset}
                className="search-btn-reset"
                id="btn-reset-search"
              >
                <span>✕</span>
                Xóa tra cứu
              </button>
            )}
          </div>
        </form>
      </section>

      {/* Results */}
      {searched && (
        <section className="results-section">
          <div className="results-header">
            <div className="results-count">
              {results.length > 0 ? (
                <>Tìm thấy <strong>{results.length}</strong> kết quả</>
              ) : (
                <>Không tìm thấy kết quả</>
              )}
            </div>
            <button
              className="results-clear-btn"
              onClick={handleReset}
              title="Xóa kết quả và tra cứu lại"
            >
              ✕ Tra cứu lại
            </button>
          </div>

          {results.length === 0 ? (
            <div className="no-results">
              <div className="no-results-icon">🔍</div>
              <h3>Không tìm thấy kết quả</h3>
              <p className="text-muted">
                Vui lòng kiểm tra lại thông tin tra cứu hoặc liên hệ Chi bộ/Đảng bộ cơ sở
              </p>
              <button className="btn btn-secondary" onClick={handleReset} style={{ marginTop: '1rem' }}>
                ↩ Tra cứu lại
              </button>
            </div>
          ) : (
            results.map((applicant, index) => {
              const isExpanded = expandedId === applicant.id;
              const progress = getProgressPercent(applicant);
              const currentStep = getCurrentStep(applicant);
              const isCancelled = currentStep === -1;

              return (
                <div
                  key={applicant.id}
                  className="applicant-card"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {/* Name & Chi bộ */}
                  <div style={{ marginBottom: '1rem' }}>
                    <div className="applicant-name">{applicant.hoTen}</div>
                    <div className="applicant-chibo">
                      🏛️ {applicant.chiBoDangBo}
                    </div>
                  </div>

                  {/* Info grid */}
                  <div className="applicant-info">
                    <div className="applicant-info-item">
                      <span className="applicant-info-label">Số CCCD</span>
                      <span className="applicant-info-value">{applicant.cccd}</span>
                    </div>
                    <div className="applicant-info-item">
                      <span className="applicant-info-label">Ngày sinh</span>
                      <span className="applicant-info-value">
                        {new Date(applicant.ngaySinh).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                    <div className="applicant-info-item">
                      <span className="applicant-info-label">Tiến độ</span>
                      <span className="applicant-info-value">
                        {isCancelled ? (
                          <span className="text-danger">Hủy hồ sơ</span>
                        ) : (
                          <span>{progress}% — Bước {currentStep}/{applicant.quyTrinh.length}</span>
                        )}
                      </span>
                    </div>
                    <div className="applicant-info-item">
                      <span className="applicant-info-label">Ngày tạo hồ sơ</span>
                      <span className="applicant-info-value">
                        {new Date(applicant.ngayTao).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                  </div>

                  {/* Toggle expand */}
                  <button
                    className={`expand-btn ${isExpanded ? 'expanded' : ''}`}
                    onClick={() => setExpandedId(isExpanded ? null : applicant.id)}
                  >
                    <span className="expand-btn-icon">{isExpanded ? '▲' : '▼'}</span>
                    {isExpanded ? 'Thu gọn quy trình' : 'Xem chi tiết quy trình'}
                  </button>

                  {/* Timeline */}
                  {isExpanded && (
                    <div className="expand-content">
                      <ProcessTimeline quyTrinh={applicant.quyTrinh} />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </section>
      )}

      {/* Footer */}
      <footer className="footer">
        <p>© 2025 Hệ Thống Quản Lý Quy Trình Kết Nạp Đảng. Phát triển bởi <a href="#">RCHG 2025</a></p>
      </footer>
    </>
  );
}
