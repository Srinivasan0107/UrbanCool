import { Router } from 'express';
import Alert from '../models/Alert.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { ward, severity, targetRole } = req.query;
    const filter = {};
    if (ward) filter.ward = ward;
    if (severity) filter.severity = severity;
    if (targetRole) filter.$or = [{ targetRole }, { targetRole: 'all' }];
    const data = await Alert.find(filter).populate('hotspotId').sort({ createdAt: -1 });
    res.json({ success: true, data, error: null });
  } catch (err) { next(err); }
});

router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { title, severity, recommendedAction, targetRole = 'all', ward, hotspotId } = req.body;
    if (!severity || !recommendedAction || !ward) {
      return res.status(422).json({
        success: false,
        data: null,
        error: 'severity, recommendedAction, and ward are required',
      });
    }
    const alert = await Alert.create({
      title: title || `${severity.toUpperCase()} Heat Advisory — ${ward}`,
      severity,
      recommendedAction,
      targetRole,
      ward,
      hotspotId: hotspotId || undefined,
      createdAt: new Date(),
    });
    res.status(201).json({ success: true, data: alert, error: null });
  } catch (err) { next(err); }
});

router.patch('/mark-all-read', requireAuth, async (req, res, next) => {
  try {
    const { ward } = req.body;
    const filter = ward ? { ward } : {};
    await Alert.updateMany(filter, { $set: { read: true } });
    res.json({ success: true, data: { message: 'All alerts marked as read' }, error: null });
  } catch (err) { next(err); }
});

router.patch('/:id/read', requireAuth, async (req, res, next) => {
  try {
    const alert = await Alert.findByIdAndUpdate(req.params.id, { $set: { read: true } }, { new: true });
    if (!alert) return res.status(404).json({ success: false, data: null, error: 'Not found' });
    res.json({ success: true, data: alert, error: null });
  } catch (err) { next(err); }
});

export default router;
