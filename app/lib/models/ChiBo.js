import mongoose from 'mongoose';

const ChiBoSchema = new mongoose.Schema({
  ten: { type: String, required: true, unique: true },
  biThu: { type: String, default: '' },
  chanhVanPhong: { type: String, default: '' },
  soDienThoai: { type: String, default: '' },
  email: { type: String, default: '' },
}, { timestamps: true });

export default mongoose.models.ChiBo || mongoose.model('ChiBo', ChiBoSchema);
