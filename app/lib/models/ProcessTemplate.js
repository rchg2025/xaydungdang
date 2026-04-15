import mongoose from 'mongoose';

const ProcessTemplateSchema = new mongoose.Schema({
  soThuTu: { type: Number, required: true, unique: true },
  tenQuyTrinh: { type: String, required: true },
}, { timestamps: true });

export default mongoose.models.ProcessTemplate || mongoose.model('ProcessTemplate', ProcessTemplateSchema);
