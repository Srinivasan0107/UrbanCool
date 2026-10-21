import mongoose from 'mongoose';

const WeatherStationSchema = new mongoose.Schema(
  {
    stationId:   { type: String, required: true, unique: true },
    location:    {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
    temperature: { type: Number },
    humidity:    { type: Number },
    windSpeed:   { type: Number },
    timestamp:   { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model('WeatherStation', WeatherStationSchema);
