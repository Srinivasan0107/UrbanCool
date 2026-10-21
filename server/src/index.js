import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { connectDB } from './db.js';
import { errorHandler } from './middleware/errorHandler.js';

import authRoutes from './routes/auth.js';
import sensorRoutes from './routes/sensors.js';
import stationRoutes from './routes/stations.js';
import hotspotRoutes from './routes/hotspots.js';
import greencoverRoutes from './routes/greencover.js';
import coolingRoutes from './routes/cooling.js';
import alertRoutes from './routes/alerts.js';
import userRoutes from './routes/users.js';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/sensors', sensorRoutes);
app.use('/api/v1/stations', stationRoutes);
app.use('/api/v1/hotspots', hotspotRoutes);
app.use('/api/v1/greencover', greencoverRoutes);
app.use('/api/v1/cooling', coolingRoutes);
app.use('/api/v1/alerts', alertRoutes);
app.use('/api/v1/users', userRoutes);

app.use(errorHandler);

export default app;

if (process.env.NODE_ENV !== 'test') {
  await connectDB();
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`UrbanCool API running on port ${PORT}`));
}
