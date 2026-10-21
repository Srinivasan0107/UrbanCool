import mongoose from 'mongoose';
import { spawn } from 'child_process';
import { existsSync, mkdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

let localMongodProcess = null;

async function startLocalMongo(dataDir) {
  const { MongoBinary } = await import('mongodb-memory-server');
  const binPath = await MongoBinary.getPath();

  console.log(`Starting local MongoDB on port 27017...\nData directory: ${dataDir}`);
  localMongodProcess = spawn(binPath, [
    '--dbpath', dataDir,
    '--port', '27017',
    '--bind_ip', '127.0.0.1',
  ], { stdio: 'ignore' });

  localMongodProcess.unref();

  const shutdown = () => {
    if (localMongodProcess && !localMongodProcess.killed) {
      try {
        localMongodProcess.kill('SIGINT');
      } catch {}
    }
  };
  process.on('exit', shutdown);
  process.on('SIGINT', () => { shutdown(); process.exit(); });
  process.on('SIGTERM', () => { shutdown(); process.exit(); });
}

export async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/urbancool';
  const isLocal = uri.includes('localhost') || uri.includes('127.0.0.1');

  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 4000 });
    console.log('✅ MongoDB connected to Atlas:', mongoose.connection.host);
  } catch (err) {
    if (!isLocal) {
      console.warn('\n======================================================');
      console.warn('⚠️  MONGODB ATLAS IP WHITELIST BLOCKED');
      console.warn('Your current public IP is not in Atlas Network Access list.');
      console.warn('👉 Quick Fix: cloud.mongodb.com -> Network Access -> Add IP -> 0.0.0.0/0');
      console.warn('======================================================\n');
    }

    if (process.env.NODE_ENV !== 'test') {
      console.log('🔄 Launching local embedded MongoDB on port 27017 so app stays online...');
      const __dirname = path.dirname(fileURLToPath(import.meta.url));
      const dataDir = path.resolve(__dirname, '..', '.mongo-data');
      if (!existsSync(dataDir)) {
        mkdirSync(dataDir, { recursive: true });
      }

      await startLocalMongo(dataDir);

      let connected = false;
      const localUri = 'mongodb://127.0.0.1:27017/urbancool';
      for (let i = 0; i < 20; i++) {
        await new Promise((r) => setTimeout(r, 400));
        try {
          await mongoose.connect(localUri, { serverSelectionTimeoutMS: 1000 });
          connected = true;
          console.log('✅ Connected to local fallback database:', mongoose.connection.host);
          break;
        } catch {}
      }

      if (!connected) {
        throw err;
      }
    } else {
      throw err;
    }
  }
}
