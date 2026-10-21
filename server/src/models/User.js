import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new mongoose.Schema(
  {
    name:         { type: String, required: true, trim: true },
    email:        { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String, required: false },
    googleId:     { type: String, default: null },
    picture:      { type: String, default: null },
    role:         { type: String, enum: ['planner', 'citizen'], default: 'citizen' },
    ward:         { type: String, default: 'Ward-2' },
    phone:        { type: String, default: '+91 98401 23456' },
    department:   { type: String, default: 'Greater Chennai Corporation — Heat Resilience Cell' },
    notificationPreferences: {
      email:        { type: Boolean, default: true },
      push:         { type: Boolean, default: true },
      sms:          { type: Boolean, default: true },
      criticalOnly: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

UserSchema.methods.comparePassword = async function (plain) {
  if (!this.passwordHash) return false;
  return bcrypt.compare(plain, this.passwordHash);
};

export default mongoose.model('User', UserSchema);
