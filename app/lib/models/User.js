import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  hoTen: { type: String, required: true },
  email: { type: String, default: '' },
  role: { type: String, enum: ['admin', 'bien_tap_vien'], default: 'bien_tap_vien' },
  password: { type: String, required: true },
  ngayTao: { type: String, default: () => new Date().toISOString().slice(0, 10) },
  active: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.models.User || mongoose.model('User', UserSchema);
