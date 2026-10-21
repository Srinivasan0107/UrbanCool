import { Router } from 'express';
import HeatHotspot from '../models/HeatHotspot.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { ward, status, intensity } = req.query;
    const filter = {};
    if (ward) filter.wardId = ward;
    if (status) filter.status = status;
    if (intensity) filter.intensity = intensity;
    const data = await HeatHotspot.find(filter).sort({ detectedAt: -1 });
    res.json({ success: true, data, error: null });
  } catch (err) { next(err); }
});

router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const data = await HeatHotspot.findById(req.params.id);
    if (!data) return res.status(404).json({ success: false, data: null, error: 'Not found' });
    res.json({ success: true, data, error: null });
  } catch (err) { next(err); }
});

export default router;
