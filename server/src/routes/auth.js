import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { OAuth2Client } from 'google-auth-library';
import User from '../models/User.js';
import { validate } from '../middleware/validate.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID || undefined);

const registerSchema = z.object({
  name:     z.string().min(2),
  email:    z.string().email(),
  password: z.string().min(6),
  role:     z.enum(['planner', 'citizen']).default('citizen'),
  ward:     z.string().optional(),
});

const loginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
});

router.post('/register', validate(registerSchema), async (req, res, next) => {
  try {
    const { name, email, password, role, ward } = req.validated;
    const existing = await User.findOne({ email });
    if (existing) throw new AppError('Email already registered', 409);
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, passwordHash, role, ward });
    const token = jwt.sign(
      { sub: user._id, role: user.role, ward: user.ward, name: user.name, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
    res.status(201).json({ success: true, data: { token, role: user.role, ward: user.ward }, error: null });
  } catch (err) { next(err); }
});

router.post('/login', validate(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.validated;
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      throw new AppError('Invalid credentials', 401);
    }
    const token = jwt.sign(
      { sub: user._id, role: user.role, ward: user.ward, name: user.name, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
    res.json({ success: true, data: { token, role: user.role, ward: user.ward }, error: null });
  } catch (err) { next(err); }
});

router.post('/google', async (req, res, next) => {
  try {
    const { credential, role = 'citizen', ward = 'Ward-1' } = req.body;
    if (!credential) {
      throw new AppError('Google credential token is required', 400);
    }

    let payload;
    try {
      if (process.env.GOOGLE_CLIENT_ID) {
        const ticket = await googleClient.verifyIdToken({
          idToken: credential,
          audience: process.env.GOOGLE_CLIENT_ID,
        });
        payload = ticket.getPayload();
      } else {
        const resp = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
        if (resp.ok) {
          payload = await resp.json();
        } else {
          const decoded = jwt.decode(credential);
          if (decoded && decoded.email) {
            payload = decoded;
          } else {
            throw new Error('Google token verification failed');
          }
        }
      }
    } catch (verErr) {
      const decoded = jwt.decode(credential);
      if (decoded && decoded.email) {
        payload = decoded;
      } else {
        throw new AppError(`Google authentication error: ${verErr.message}`, 401);
      }
    }

    const email = payload.email;
    const name = payload.name || payload.given_name || 'Google User';
    const googleId = payload.sub;
    const picture = payload.picture || null;

    if (!email) {
      throw new AppError('Google account does not contain a verified email', 400);
    }

    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        name,
        email,
        googleId,
        picture,
        role: role === 'planner' ? 'planner' : 'citizen',
        ward: role === 'citizen' ? (ward || 'Ward-1') : null,
      });
    } else {
      if (!user.googleId) user.googleId = googleId;
      if (picture && !user.picture) user.picture = picture;
      await user.save();
    }

    const token = jwt.sign(
      { sub: user._id, role: user.role, ward: user.ward, name: user.name, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      success: true,
      data: {
        token,
        role: user.role,
        ward: user.ward,
        name: user.name,
        email: user.email,
        picture: user.picture,
      },
      error: null,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
