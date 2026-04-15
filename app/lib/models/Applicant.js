import mongoose from 'mongoose';

const ProcessStepSchema = new mongoose.Schema({
  soThuTu: { type: Number, required: true },
  tenQuyTrinh: { type: String, required: true },
  trangThai: { type: String, default: 'chua_bat_dau' },
  ngayCapNhat: { type: String, default: '' },
  gioCapNhat: { type: String, default: '' },
  ghiChu: { type: String, default: '' },
  nguoiCapNhat: { type: String, default: '' },
  lyDoTuChoi: { type: String, default: '' },
}, { _id: false });

const ApplicantSchema = new mongoose.Schema({
  cccd: { type: String, required: true, unique: true },
  hoTen: { type: String, required: true },
  ngaySinh: { type: String, required: true },
  soDienThoai: { type: String, default: '' },
  email: { type: String, default: '' },
  chiBoDangBo: { type: String, required: true },
  ngayTao: { type: String, default: () => new Date().toISOString().slice(0, 10) },
  quyTrinh: [ProcessStepSchema],
}, { timestamps: true });

export default mongoose.models.Applicant || mongoose.model('Applicant', ApplicantSchema);
