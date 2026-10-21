import request from 'supertest';
import app from '../src/index.js';
import mongoose from 'mongoose';
import HeatHotspot from '../src/models/HeatHotspot.js';
import jwt from 'jsonwebtoken';

let token;
let hotspotId;

beforeAll(async () => {
  await HeatHotspot.deleteMany({});

  // Create a signed token (planner role)
  token = jwt.sign(
    { sub: new mongoose.Types.ObjectId().toString(), role: 'planner', ward: null },
    process.env.JWT_SECRET || 'test-secret',
    { expiresIn: '1h' }
  );

  // Seed one hotspot
  const hs = await HeatHotspot.create({
    geometry:  { type: 'Point', coordinates: [77.59, 12.97] },
    intensity: 'high',
    wardId:    'Ward-1',
    status:    'active',
  });
  hotspotId = hs._id.toString();
});

describe('GET /api/v1/hotspots', () => {
  it('should return hotspots list for authenticated user (200)', async () => {
    const res = await request(app)
      .get('/api/v1/hotspots')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('should return 401 without auth token', async () => {
    const res = await request(app).get('/api/v1/hotspots');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should filter by ward query param', async () => {
    const res = await request(app)
      .get('/api/v1/hotspots?ward=Ward-1')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    res.body.data.forEach((h) => expect(h.wardId).toBe('Ward-1'));
  });
});

describe('GET /api/v1/hotspots/:id', () => {
  it('should return a specific hotspot (200)', async () => {
    const res = await request(app)
      .get(`/api/v1/hotspots/${hotspotId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.wardId).toBe('Ward-1');
    expect(res.body.data.intensity).toBe('high');
  });

  it('should return 404 for non-existent hotspot', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await request(app)
      .get(`/api/v1/hotspots/${fakeId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.data).toBeNull();
  });

  it('should return 401 without auth token', async () => {
    const res = await request(app).get(`/api/v1/hotspots/${hotspotId}`);
    expect(res.status).toBe(401);
  });
});
