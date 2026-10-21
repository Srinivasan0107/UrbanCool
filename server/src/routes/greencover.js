import { Router } from 'express';
import GreenCoverZone from '../models/GreenCoverZone.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { ward } = req.query;
    const filter = ward ? { wardId: ward } : {};
    const data = await GreenCoverZone.find(filter).sort({ recordedAt: -1 });
    res.json({ success: true, data, error: null });
  } catch (err) { next(err); }
});

router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const data = await GreenCoverZone.findById(req.params.id);
    if (!data) return res.status(404).json({ success: false, data: null, error: 'Not found' });
    res.json({ success: true, data, error: null });
  } catch (err) { next(err); }
});

export default router;
