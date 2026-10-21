import request from 'supertest';
import app from '../src/index.js';
import mongoose from 'mongoose';
import CoolingInitiative from '../src/models/CoolingInitiative.js';
import jwt from 'jsonwebtoken';

let plannerToken;
let citizenToken;
let coolingId;

const VALID_PAYLOAD = {
  name:       'Cool Roof – Ward-3',
  type:       'cool_roof',
  location:   { lat: 12.96, lng: 77.57 },
  ward:       'Ward-3',
  startDate:  '2026-01-01T00:00:00.000Z',
  beforeTemp: 42,
  status:     'planned',
};

beforeAll(async () => {
  await CoolingInitiative.deleteMany({});

  // Planner token
  plannerToken = jwt.sign(
    { sub: new mongoose.Types.ObjectId().toString(), role: 'planner', ward: null },
    process.env.JWT_SECRET || 'test-secret',
    { expiresIn: '1h' }
  );

  // Citizen token
  citizenToken = jwt.sign(
    { sub: new mongoose.Types.ObjectId().toString(), role: 'citizen', ward: 'Ward-2' },
    process.env.JWT_SECRET || 'test-secret',
    { expiresIn: '1h' }
  );

  // Seed one cooling initiative
  const ci = await CoolingInitiative.create(VALID_PAYLOAD);
  coolingId = ci._id.toString();
});

describe('GET /api/v1/cooling', () => {
  it('should return cooling list for authenticated user (200)', async () => {
    const res = await request(app)
      .get('/api/v1/cooling')
      .set('Authorization', `Bearer ${plannerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('should return 401 without auth token', async () => {
    const res = await request(app).get('/api/v1/cooling');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should allow citizen to GET cooling list (200)', async () => {
    const res = await request(app)
      .get('/api/v1/cooling')
      .set('Authorization', `Bearer ${citizenToken}`);
    expect(res.status).toBe(200);
  });
});

describe('GET /api/v1/cooling/:id', () => {
  it('should return a specific cooling initiative (200)', async () => {
    const res = await request(app)
      .get(`/api/v1/cooling/${coolingId}`)
      .set('Authorization', `Bearer ${plannerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.ward).toBe('Ward-3');
  });

  it('should return 404 for non-existent id', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await request(app)
      .get(`/api/v1/cooling/${fakeId}`)
      .set('Authorization', `Bearer ${plannerToken}`);
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});

describe('POST /api/v1/cooling', () => {
  it('should allow planner to create a cooling initiative (201)', async () => {
    const res = await request(app)
      .post('/api/v1/cooling')
      .set('Authorization', `Bearer ${plannerToken}`)
      .send({
        name:       'Water Body – Ward-4',
        type:       'water_body',
        location:   { lat: 12.99, lng: 77.63 },
        ward:       'Ward-4',
        startDate:  '2026-03-15T00:00:00.000Z',
        beforeTemp: 44,
        afterTemp:  40,
        status:     'active',
      });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data._id).toBeDefined();
  });

  it('should return 403 when citizen tries to POST (403)', async () => {
    const res = await request(app)
      .post('/api/v1/cooling')
      .set('Authorization', `Bearer ${citizenToken}`)
      .send(VALID_PAYLOAD);
    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('should return 422 for invalid payload (missing type)', async () => {
    const res = await request(app)
      .post('/api/v1/cooling')
      .set('Authorization', `Bearer ${plannerToken}`)
      .send({ name: 'No type', ward: 'Ward-1', startDate: '2026-01-01T00:00:00.000Z', beforeTemp: 40, location: { lat: 12.97, lng: 77.59 } });
    expect(res.status).toBe(422);
  });

  it('should return 401 without auth token', async () => {
    const res = await request(app)
      .post('/api/v1/cooling')
      .send(VALID_PAYLOAD);
    expect(res.status).toBe(401);
  });
});

describe('PATCH /api/v1/cooling/:id', () => {
  it('should allow planner to advance an initiative in the pipeline (200)', async () => {
    const res = await request(app)
      .patch(`/api/v1/cooling/${coolingId}`)
      .set('Authorization', `Bearer ${plannerToken}`)
      .send({ status: 'active' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('active');
  });

  it('should allow planner to complete initiative and record afterTemp telemetry (200)', async () => {
    const res = await request(app)
      .patch(`/api/v1/cooling/${coolingId}`)
      .set('Authorization', `Bearer ${plannerToken}`)
      .send({ status: 'completed', afterTemp: 37.5 });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('completed');
    expect(res.body.data.afterTemp).toBe(37.5);
  });

  it('should return 403 when citizen tries to PATCH (403)', async () => {
    const res = await request(app)
      .patch(`/api/v1/cooling/${coolingId}`)
      .set('Authorization', `Bearer ${citizenToken}`)
      .send({ status: 'active' });
    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('should return 404 for non-existent id on PATCH', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await request(app)
      .patch(`/api/v1/cooling/${fakeId}`)
      .set('Authorization', `Bearer ${plannerToken}`)
      .send({ status: 'active' });
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/v1/cooling/:id', () => {
  it('should return 403 when citizen tries to DELETE (403)', async () => {
    const res = await request(app)
      .delete(`/api/v1/cooling/${coolingId}`)
      .set('Authorization', `Bearer ${citizenToken}`);
    expect(res.status).toBe(403);
  });

  it('should allow planner to delete an initiative (200)', async () => {
    const ci = await CoolingInitiative.create({
      name: 'Temporary Mist Canopy',
      type: 'water_body',
      ward: 'Ward-1',
      startDate: new Date(),
      beforeTemp: 43,
      location: { lat: 13.08, lng: 80.27 },
    });
    const res = await request(app)
      .delete(`/api/v1/cooling/${ci._id}`)
      .set('Authorization', `Bearer ${plannerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

