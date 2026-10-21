import { Router } from 'express';
import User from '../models/User.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.sub).select('-passwordHash');
    if (!user) return res.status(404).json({ success: false, data: null, error: 'User not found' });
    res.json({ success: true, data: user, error: null });
  } catch (err) { next(err); }
});

router.put('/me', requireAuth, async (req, res, next) => {
  try {
    const { name, ward, phone, department, notificationPreferences, role } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (ward !== undefined) updates.ward = ward;
    if (phone !== undefined) updates.phone = phone;
    if (department !== undefined) updates.department = department;
    if (role && ['planner', 'citizen'].includes(role)) updates.role = role;
    if (notificationPreferences) updates.notificationPreferences = notificationPreferences;

    const user = await User.findByIdAndUpdate(req.user.sub, { $set: updates }, { new: true }).select('-passwordHash');
    if (!user) return res.status(404).json({ success: false, data: null, error: 'User not found' });
    res.json({ success: true, data: user, error: null });
  } catch (err) { next(err); }
});

export default router;
