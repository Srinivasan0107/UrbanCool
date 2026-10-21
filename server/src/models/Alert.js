import mongoose from 'mongoose';

const AlertSchema = new mongoose.Schema(
  {
    hotspotId:         { type: mongoose.Schema.Types.ObjectId, ref: 'HeatHotspot', required: false },
    title:             { type: String, default: 'Heat Advisory' },
    severity:          { type: String, enum: ['low', 'medium', 'high', 'critical'], required: true },
    recommendedAction: { type: String, required: true },
    targetRole:        { type: String, enum: ['planner', 'citizen', 'all'], default: 'all' },
    ward:              { type: String, required: true },
    read:              { type: Boolean, default: false },
    createdAt:         { type: Date, default: Date.now },
  },
  { timestamps: false }
);

AlertSchema.index({ ward: 1, severity: 1 });
export default mongoose.model('Alert', AlertSchema);
