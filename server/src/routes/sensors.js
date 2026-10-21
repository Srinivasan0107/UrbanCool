import { Router } from 'express';
import SensorReading from '../models/SensorReading.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { ward, limit = 100 } = req.query;
    const filter = ward ? { ward } : {};
    const data = await SensorReading.find(filter).sort({ timestamp: -1 }).limit(Number(limit));
    res.json({ success: true, data, error: null });
  } catch (err) { next(err); }
});

router.get('/:id', requireAuth, requireRole('planner'), async (req, res, next) => {
  try {
    const data = await SensorReading.findById(req.params.id);
    if (!data) return res.status(404).json({ success: false, data: null, error: 'Not found' });
    res.json({ success: true, data, error: null });
  } catch (err) { next(err); }
});

export default router;
