import mongoose from 'mongoose';

const GreenCoverZoneSchema = new mongoose.Schema(
  {
    wardId:             { type: String, required: true },
    geometry:           {
      type:        { type: String, enum: ['Polygon'], required: true },
      coordinates: { type: [[[Number]]], required: true },
    },
    ndviValue:          { type: Number, required: true, min: -1, max: 1 },
    changeFromBaseline: { type: Number, required: true },
    recordedAt:         { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model('GreenCoverZone', GreenCoverZoneSchema);
