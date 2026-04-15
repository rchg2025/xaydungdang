'use client';

import { STATUS_LABELS, STATUS_ICONS, STATUSES } from '../lib/constants';

function getStepClass(trangThai) {
  switch (trangThai) {
    case STATUSES.DA_NHAN_PHAN_HOI: return 'completed';
    case STATUSES.DANG_XU_LY: return 'processing';
    case STATUSES.DA_GUI: return 'sent';
    case STATUSES.HUY_HO_SO: return 'cancelled';
    default: return 'pending';
  }
}

function getStepIcon(trangThai, soThuTu) {
  switch (trangThai) {
    case STATUSES.DA_NHAN_PHAN_HOI: return '✓';
    case STATUSES.DANG_XU_LY: return '⟳';
    case STATUSES.DA_GUI: return '↗';
    case STATUSES.HUY_HO_SO: return '✕';
    default: return soThuTu;
  }
}

export default function ProcessTimeline({ quyTrinh, compact = false }) {
  if (!quyTrinh || quyTrinh.length === 0) return null;

  if (compact) {
    return (
      <div className="timeline">
        <div className="timeline-progress">
          {quyTrinh.map((step, idx) => {
            const stepClass = getStepClass(step.trangThai);
            const isLastCompleted = idx < quyTrinh.length - 1 && 
              step.trangThai === STATUSES.DA_NHAN_PHAN_HOI;
            
            return (
              <div key={step.soThuTu} className="timeline-progress-step">
                <div 
                  className={`timeline-progress-dot ${stepClass}`}
                  title={`${step.tenQuyTrinh} - ${STATUS_LABELS[step.trangThai]}`}
                >
                  {getStepIcon(step.trangThai, step.soThuTu)}
                </div>
                {idx < quyTrinh.length - 1 && (
                  <div className={`timeline-progress-line ${isLastCompleted ? 'completed' : ''}`} />
                )}
                <div className="timeline-progress-label">
                  {step.soThuTu}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="timeline">
      <div className="timeline-title">📋 Tiến trình kết nạp</div>
      
      {/* Progress bar */}
      <div className="timeline-progress">
        {quyTrinh.map((step, idx) => {
          const stepClass = getStepClass(step.trangThai);
          const isLastCompleted = idx < quyTrinh.length - 1 && 
            step.trangThai === STATUSES.DA_NHAN_PHAN_HOI;
          
          return (
            <div key={step.soThuTu} className="timeline-progress-step">
              <div 
                className={`timeline-progress-dot ${stepClass}`}
                title={`${step.tenQuyTrinh} - ${STATUS_LABELS[step.trangThai]}`}
              >
                {getStepIcon(step.trangThai, step.soThuTu)}
              </div>
              {idx < quyTrinh.length - 1 && (
                <div className={`timeline-progress-line ${isLastCompleted ? 'completed' : ''}`} />
              )}
              <div className="timeline-progress-label">
                B{step.soThuTu}
              </div>
            </div>
          );
        })}
      </div>

      {/* Detail list */}
      <div className="timeline-list">
        {quyTrinh.map((step) => {
          const stepClass = getStepClass(step.trangThai);
          return (
            <div key={step.soThuTu} className={`timeline-item ${stepClass === 'completed' ? 'item-completed' : ''}`}>
              <div className={`timeline-item-dot timeline-progress-dot ${stepClass}`}>
                {getStepIcon(step.trangThai, step.soThuTu)}
              </div>
              <div className="timeline-item-content">
                <div className="timeline-item-header">
                  <span className="timeline-item-title">
                    Bước {step.soThuTu}: {step.tenQuyTrinh}
                  </span>
                  <span className={`status-badge status-${step.trangThai}`}>
                    {STATUS_ICONS[step.trangThai]} {STATUS_LABELS[step.trangThai]}
                  </span>
                </div>
                {step.ngayCapNhat && (
                  <div className="timeline-item-date">
                    📅 Cập nhật: {new Date(step.ngayCapNhat).toLocaleDateString('vi-VN')}
                  </div>
                )}
                {step.ghiChu && (
                  <div className="timeline-item-note">
                    💬 {step.ghiChu}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
