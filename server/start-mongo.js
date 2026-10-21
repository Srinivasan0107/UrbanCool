import { spawn } from 'child_process';
import { existsSync, mkdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { MongoBinary } from 'mongodb-memory-server';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, '.mongo-data');

if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
}

console.log('Resolving MongoDB binary...');
const binPath = await MongoBinary.getPath();
console.log(`Starting local MongoDB on port 27017...\nData directory: ${dataDir}`);

const mongod = spawn(binPath, [
  '--dbpath', dataDir,
  '--port', '27017',
  '--bind_ip', '127.0.0.1'
], { stdio: 'inherit' });

mongod.on('close', (code) => {
  console.log(`MongoDB process exited with code ${code}`);
});

process.on('SIGINT', () => {
  mongod.kill('SIGINT');
  process.exit();
});
process.on('SIGTERM', () => {
  mongod.kill('SIGTERM');
  process.exit();
});
