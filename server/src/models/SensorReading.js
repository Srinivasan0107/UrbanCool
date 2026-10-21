import mongoose from 'mongoose';

const SensorReadingSchema = new mongoose.Schema(
  {
    sensorId:    { type: String, required: true },
    ward:        { type: String, required: true },
    lat:         { type: Number, required: true },
    lng:         { type: Number, required: true },
    temperature: { type: Number, required: true },
    humidity:    { type: Number, required: true },
    timestamp:   { type: Date, default: Date.now },
  },
  { timestamps: true }
);

SensorReadingSchema.index({ ward: 1, timestamp: -1 });
export default mongoose.model('SensorReading', SensorReadingSchema);
