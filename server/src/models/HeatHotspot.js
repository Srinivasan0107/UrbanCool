import mongoose from 'mongoose';

const HeatHotspotSchema = new mongoose.Schema(
  {
    name:       { type: String },
    landmark:   { type: String },
    peakTemp:   { type: Number },
    center:     {
      lat: { type: Number },
      lng: { type: Number },
    },
    geometry:   {
      type:        { type: String, enum: ['Point', 'Polygon'], required: true },
      coordinates: { type: mongoose.Schema.Types.Mixed, required: true },
    },
    intensity:  { type: String, enum: ['low', 'medium', 'high', 'critical'], required: true },
    wardId:     { type: String, required: true },
    detectedAt: { type: Date, default: Date.now },
    status:     { type: String, enum: ['active', 'resolved'], default: 'active' },
  },
  { timestamps: true }
);

HeatHotspotSchema.index({ wardId: 1, status: 1 });
export default mongoose.model('HeatHotspot', HeatHotspotSchema);
