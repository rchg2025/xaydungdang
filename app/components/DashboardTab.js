'use client';

import { useState } from 'react';
import { getCurrentStep } from '../lib/store';
import ProcessTimeline from './ProcessTimeline';

const PAGE_SIZE = 10;

// ---- Paginator ----
function Paginator({ page, total, onPage }) {
  if (total <= 1) return null;
  return (
    <div className="pagination">
      <button className="page-btn" onClick={() => onPage(p => Math.max(1, p - 1))} disabled={page === 1}>← Trước</button>
      {Array.from({ length: total }, (_, i) => i + 1).map(p => (
        <button key={p} className={`page-btn ${page === p ? 'active' : ''}`} onClick={() => onPage(p)}>{p}</button>
      ))}
      <button className="page-btn" onClick={() => onPage(p => Math.min(total, p + 1))} disabled={page === total}>Tiếp →</button>
    </div>
  );
}

// =============================================
// Dashboard Tab Component
// =============================================
export default function DashboardTab({ applicants, stats }) {
  const [page, setPage] = useState(1);
  const [viewApplicant, setViewApplicant] = useState(null);

  if (!stats) return null;

  // Sort newest first
  const sorted = [...applicants].sort((a, b) => new Date(b.ngayTao) - new Date(a.ngayTao));
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const pageItems = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <>
      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'rgba(59,130,246,0.12)', color: '#60a5fa', boxShadow: '0 0 0 1px rgba(59,130,246,0.2)' }}>📁</div>
          <div className="stat-card-body">
            <div className="stat-card-value" style={{ color: '#60a5fa' }}>{stats.tongSo}</div>
            <div className="stat-card-label">Tổng hồ sơ</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'rgba(99,102,241,0.12)', color: '#818cf8', boxShadow: '0 0 0 1px rgba(99,102,241,0.2)' }}>🔄</div>
          <div className="stat-card-body">
            <div className="stat-card-value" style={{ color: '#818cf8' }}>{stats.dangXuLy}</div>
            <div className="stat-card-label">Đang xử lý</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'rgba(16,185,129,0.12)', color: '#34d399', boxShadow: '0 0 0 1px rgba(16,185,129,0.2)' }}>✅</div>
          <div className="stat-card-body">
            <div className="stat-card-value" style={{ color: '#10b981' }}>{stats.daHoanThanh}</div>
            <div className="stat-card-label">Hoàn thành</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'rgba(245,158,11,0.12)', color: '#fbbf24', boxShadow: '0 0 0 1px rgba(245,158,11,0.2)' }}>⏳</div>
          <div className="stat-card-body">
            <div className="stat-card-value" style={{ color: '#f59e0b' }}>{stats.choXuLy}</div>
            <div className="stat-card-label">Chờ xử lý</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171', boxShadow: '0 0 0 1px rgba(239,68,68,0.2)' }}>❌</div>
          <div className="stat-card-body">
            <div className="stat-card-value" style={{ color: '#ef4444' }}>{stats.daHuy}</div>
            <div className="stat-card-label">Đã từ chối</div>
          </div>
        </div>
      </div>

      {/* Recent list */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '1.5rem 0 1rem', flexWrap: 'wrap', gap: '8px' }}>
        <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, margin: 0 }}>Hồ sơ gần đây</h3>
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
          Tổng {sorted.length} hồ sơ &nbsp;·&nbsp; Trang {page}/{totalPages}
        </span>
      </div>

      <div className="data-table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Họ tên</th>
              <th>CCCD</th>
              <th>Chi bộ/Đảng bộ</th>
              <th>Tiến độ</th>
              <th>Ngày tạo</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.map((a, i) => {
              const step = getCurrentStep(a);
              const isCancelled = step === -1;
              const currentStepObj = !isCancelled
                ? a.quyTrinh.find(s => s.soThuTu === step + 1) || a.quyTrinh[step]
                : null;

              return (
                <tr key={a.id}>
                  <td>{(page - 1) * PAGE_SIZE + i + 1}</td>
                  <td>
                    <button
                      className="dashboard-name-btn"
                      onClick={() => setViewApplicant(a)}
                      title="Xem quy trình"
                    >
                      {a.hoTen}
                    </button>
                  </td>
                  <td style={{ fontSize: 'var(--text-xs)' }}>{a.cccd}</td>
                  <td style={{ fontSize: 'var(--text-xs)' }}>{a.chiBoDangBo}</td>
                  <td>
                    {isCancelled ? (
                      <span className="status-badge status-huy_ho_so">✕ Từ chối</span>
                    ) : (
                      <span className="status-badge status-dang_xu_ly">
                        Bước {step}/{a.quyTrinh.length}
                      </span>
                    )}
                  </td>
                  <td style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                    {new Date(a.ngayTao).toLocaleDateString('vi-VN')}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Paginator page={page} total={totalPages} onPage={setPage} />

      {/* ====== VIEW PROCESS MODAL (read-only) ====== */}
      {viewApplicant && (
        <div className="modal-overlay" onClick={() => setViewApplicant(null)}>
          <div className="modal modal-wide" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 style={{ margin: 0 }}>📋 Quy trình — {viewApplicant.hoTen}</h3>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                  CCCD: {viewApplicant.cccd} &nbsp;|&nbsp; {viewApplicant.chiBoDangBo}
                </div>
              </div>
              <button className="modal-close" onClick={() => setViewApplicant(null)}>✕</button>
            </div>
            <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              <ProcessTimeline quyTrinh={viewApplicant.quyTrinh} />
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setViewApplicant(null)}>Đóng</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
