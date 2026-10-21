import { Router } from 'express';
import WeatherStation from '../models/WeatherStation.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAuth, requireRole('planner'), async (req, res, next) => {
  try {
    const data = await WeatherStation.find().sort({ timestamp: -1 });
    res.json({ success: true, data, error: null });
  } catch (err) { next(err); }
});

router.get('/:id', requireAuth, requireRole('planner'), async (req, res, next) => {
  try {
    const data = await WeatherStation.findById(req.params.id);
    if (!data) return res.status(404).json({ success: false, data: null, error: 'Not found' });
    res.json({ success: true, data, error: null });
  } catch (err) { next(err); }
});

export default router;
