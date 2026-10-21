import { Router } from 'express';
import { z } from 'zod';
import CoolingInitiative from '../models/CoolingInitiative.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

const createSchema = z.object({
  name:        z.string().min(2),
  description: z.string().optional(),
  type:        z.enum(['tree_plantation', 'cool_roof', 'reflective_pavement', 'water_body']),
  location:    z.object({ lat: z.number(), lng: z.number() }),
  ward:        z.string().min(1),
  startDate:   z.string().datetime(),
  beforeTemp:  z.number(),
  afterTemp:   z.number().optional(),
  status:      z.enum(['planned', 'active', 'completed']).optional(),
});

const updateSchema = z.object({
  name:        z.string().min(2).optional(),
  description: z.string().optional(),
  type:        z.enum(['tree_plantation', 'cool_roof', 'reflective_pavement', 'water_body']).optional(),
  location:    z.object({ lat: z.number(), lng: z.number() }).optional(),
  ward:        z.string().min(1).optional(),
  startDate:   z.string().datetime().optional(),
  beforeTemp:  z.number().optional(),
  afterTemp:   z.number().nullable().optional(),
  status:      z.enum(['planned', 'active', 'completed']).optional(),
});

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { ward, status, type } = req.query;
    const filter = {};
    if (ward) filter.ward = ward;
    if (status) filter.status = status;
    if (type) filter.type = type;
    const data = await CoolingInitiative.find(filter).sort({ startDate: -1 });
    res.json({ success: true, data, error: null });
  } catch (err) { next(err); }
});

router.post('/', requireAuth, requireRole('planner'), validate(createSchema), async (req, res, next) => {
  try {
    const data = await CoolingInitiative.create(req.validated);
    res.status(201).json({ success: true, data, error: null });
  } catch (err) { next(err); }
});

router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const data = await CoolingInitiative.findById(req.params.id);
    if (!data) return res.status(404).json({ success: false, data: null, error: 'Not found' });
    res.json({ success: true, data, error: null });
  } catch (err) { next(err); }
});

router.patch('/:id', requireAuth, requireRole('planner'), validate(updateSchema), async (req, res, next) => {
  try {
    const data = await CoolingInitiative.findByIdAndUpdate(
      req.params.id,
      { $set: req.validated },
      { new: true, runValidators: true }
    );
    if (!data) return res.status(404).json({ success: false, data: null, error: 'Not found' });
    res.json({ success: true, data, error: null });
  } catch (err) { next(err); }
});

router.delete('/:id', requireAuth, requireRole('planner'), async (req, res, next) => {
  try {
    const data = await CoolingInitiative.findByIdAndDelete(req.params.id);
    if (!data) return res.status(404).json({ success: false, data: null, error: 'Not found' });
    res.json({ success: true, data: { message: 'Initiative deleted', id: req.params.id }, error: null });
  } catch (err) { next(err); }
});

export default router;
