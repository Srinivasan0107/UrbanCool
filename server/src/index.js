import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { connectDB } from './db.js';
import { errorHandler } from './middleware/errorHandler.js';

import authRoutes from './routes/auth.js';
import sensorRoutes from './routes/sensors.js';
import stationRoutes from './routes/stations.js';
import hotspotRoutes from './routes/hotspots.js';
import greencoverRoutes from './routes/greencover.js';
import coolingRoutes from './routes/cooling.js';
import alertRoutes from './routes/alerts.js';
import userRoutes from './routes/users.js';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/sensors', sensorRoutes);
app.use('/api/v1/stations', stationRoutes);
app.use('/api/v1/hotspots', hotspotRoutes);
app.use('/api/v1/greencover', greencoverRoutes);
app.use('/api/v1/cooling', coolingRoutes);
app.use('/api/v1/alerts', alertRoutes);
app.use('/api/v1/users', userRoutes);

// Root and /api/v1 Interactive API Test Dashboard
const renderApiDashboard = (req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>UrbanCool API Explorer & Health Dashboard</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Plus Jakarta Sans', sans-serif;
      background: radial-gradient(ellipse at 15% 15%, rgba(16, 185, 129, 0.15), transparent 50%),
                  radial-gradient(ellipse at 85% 85%, rgba(59, 130, 246, 0.12), transparent 50%),
                  #0b0f19;
      color: #e2e8f0;
      min-height: 100vh;
      padding: 32px 20px;
    }
    .container { max-width: 1020px; margin: 0 auto; }
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 16px;
      margin-bottom: 28px;
      padding-bottom: 20px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }
    .brand { display: flex; align-items: center; gap: 12px; }
    .logo {
      width: 44px;
      height: 44px;
      background: linear-gradient(135deg, #10b981, #059669);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 22px;
      box-shadow: 0 0 20px rgba(16, 185, 129, 0.4);
    }
    h1 { font-size: 24px; font-weight: 800; color: #fff; letter-spacing: -0.5px; }
    .subtitle { font-size: 13px; color: #94a3b8; }
    .badge-status {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 6px 14px;
      background: rgba(16, 185, 129, 0.12);
      border: 1px solid rgba(16, 185, 129, 0.3);
      border-radius: 999px;
      color: #34d399;
      font-size: 13px;
      font-weight: 600;
    }
    .dot { width: 8px; height: 8px; border-radius: 50%; background: #34d399; box-shadow: 0 0 10px #34d399; animation: pulse 2s infinite; }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
    .glass-card {
      background: rgba(18, 24, 38, 0.7);
      backdrop-filter: blur(16px);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 16px;
      padding: 24px;
      margin-bottom: 24px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
    }
    .card-title { font-size: 16px; font-weight: 700; color: #f8fafc; margin-bottom: 12px; display: flex; align-items: center; gap: 8px; }
    .auth-bar { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 16px; }
    input[type="text"] {
      flex: 1;
      min-width: 260px;
      background: #060911;
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 10px;
      color: #f1f5f9;
      font-family: 'JetBrains Mono', monospace;
      font-size: 12px;
      padding: 10px 14px;
      outline: none;
    }
    input[type="text"]:focus { border-color: #10b981; box-shadow: 0 0 10px rgba(16, 185, 129, 0.2); }
    button {
      background: linear-gradient(135deg, #10b981, #059669);
      color: #fff;
      border: none;
      border-radius: 10px;
      padding: 10px 18px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }
    button:hover { filter: brightness(1.1); transform: translateY(-1px); }
    .btn-secondary {
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.12);
      color: #cbd5e1;
    }
    .btn-secondary:hover { background: rgba(255, 255, 255, 0.12); }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 13px; }
    th { text-align: left; padding: 12px; color: #94a3b8; font-weight: 600; border-bottom: 1px solid rgba(255, 255, 255, 0.1); }
    td { padding: 12px; border-bottom: 1px solid rgba(255, 255, 255, 0.05); vertical-align: middle; }
    .method {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 6px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      font-weight: 700;
    }
    .get { background: rgba(59, 130, 246, 0.18); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.3); }
    .post { background: rgba(16, 185, 129, 0.18); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3); }
    .patch { background: rgba(245, 158, 11, 0.18); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.3); }
    .endpoint { font-family: 'JetBrains Mono', monospace; color: #f1f5f9; font-size: 12px; }
    .action-btn {
      padding: 6px 12px;
      font-size: 12px;
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.12);
      color: #38bdf8;
    }
    .action-btn:hover { background: rgba(56, 189, 248, 0.15); border-color: rgba(56, 189, 248, 0.4); }
    #console-box {
      display: none;
      margin-top: 18px;
      background: #05070d;
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 12px;
      padding: 16px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 12px;
      max-height: 380px;
      overflow-y: auto;
      white-space: pre-wrap;
      word-break: break-all;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="brand">
        <div class="logo">🌿</div>
        <div>
          <h1>UrbanCool API Test Dashboard</h1>
          <div class="subtitle">MERN Stack Microclimate Intelligence Engine • Version 1.0.0</div>
        </div>
      </div>
      <div class="badge-status">
        <span class="dot"></span>
        API Online on Port 5000
      </div>
    </div>

    <div class="glass-card">
      <div class="card-title">🔑 Authentication & Quick Token Generator</div>
      <p style="font-size: 13px; color: #94a3b8; margin-bottom: 12px;">
        Generate an active JWT Bearer token with one click using the demo credentials to test protected routes.
      </p>
      <div class="auth-bar">
        <input type="text" id="token-input" placeholder="Bearer token will appear here after login..." readonly />
        <button onclick="autoLogin('planner')">⚡ Login as Planner</button>
        <button class="btn-secondary" onclick="autoLogin('citizen')">👤 Login as Citizen</button>
      </div>
    </div>

    <div class="glass-card">
      <div class="card-title">🚀 Interactive Route Explorer</div>
      <table>
        <thead>
          <tr>
            <th>Method</th>
            <th>Route</th>
            <th>Description</th>
            <th>Auth</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><span class="method get">GET</span></td>
            <td class="endpoint">/api/v1/hotspots</td>
            <td>16 Tamil Nadu Thermal Hotspots</td>
            <td>🔒 Bearer</td>
            <td><button class="action-btn" onclick="testEndpoint('/api/v1/hotspots')">Test</button></td>
          </tr>
          <tr>
            <td><span class="method get">GET</span></td>
            <td class="endpoint">/api/v1/hotspots?ward=Ward-2</td>
            <td>Filter Hotspots by Ward (T. Nagar)</td>
            <td>🔒 Bearer</td>
            <td><button class="action-btn" onclick="testEndpoint('/api/v1/hotspots?ward=Ward-2')">Test</button></td>
          </tr>
          <tr>
            <td><span class="method get">GET</span></td>
            <td class="endpoint">/api/v1/alerts</td>
            <td>Active Heat Emergency Alerts</td>
            <td>🔒 Bearer</td>
            <td><button class="action-btn" onclick="testEndpoint('/api/v1/alerts')">Test</button></td>
          </tr>
          <tr>
            <td><span class="method get">GET</span></td>
            <td class="endpoint">/api/v1/greencover</td>
            <td>NDVI Ecological Canopy Zones</td>
            <td>🔒 Bearer</td>
            <td><button class="action-btn" onclick="testEndpoint('/api/v1/greencover')">Test</button></td>
          </tr>
          <tr>
            <td><span class="method get">GET</span></td>
            <td class="endpoint">/api/v1/sensors?ward=Ward-1</td>
            <td>Live IoT Sensor Telemetry Feed</td>
            <td>🔒 Planner</td>
            <td><button class="action-btn" onclick="testEndpoint('/api/v1/sensors?ward=Ward-1')">Test</button></td>
          </tr>
          <tr>
            <td><span class="method get">GET</span></td>
            <td class="endpoint">/api/v1/stations</td>
            <td>IMD Weather Station Telemetry</td>
            <td>🔒 Planner</td>
            <td><button class="action-btn" onclick="testEndpoint('/api/v1/stations')">Test</button></td>
          </tr>
          <tr>
            <td><span class="method get">GET</span></td>
            <td class="endpoint">/api/v1/cooling</td>
            <td>Cooling Initiatives & Sinks</td>
            <td>🔒 Bearer</td>
            <td><button class="action-btn" onclick="testEndpoint('/api/v1/cooling')">Test</button></td>
          </tr>
          <tr>
            <td><span class="method get">GET</span></td>
            <td class="endpoint">/api/v1/users/me</td>
            <td>Current User Profile & Preferences</td>
            <td>🔒 Bearer</td>
            <td><button class="action-btn" onclick="testEndpoint('/api/v1/users/me')">Test</button></td>
          </tr>
        </tbody>
      </table>

      <div id="console-box"></div>
    </div>
  </div>

  <script>
    let activeToken = localStorage.getItem('uc_test_token') || '';
    if (activeToken) {
      document.getElementById('token-input').value = activeToken;
    }

    async function autoLogin(role) {
      const email = role === 'planner' ? 'planner@urbancool.dev' : 'citizen@urbancool.dev';
      const password = role === 'planner' ? 'planner123' : 'citizen123';
      try {
        const res = await fetch('/api/v1/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (data.data?.token) {
          activeToken = data.data.token;
          localStorage.setItem('uc_test_token', activeToken);
          document.getElementById('token-input').value = activeToken;
          showOutput({ message: '✅ Authenticated successfully as ' + role, user: data.data });
        } else {
          showOutput(data);
        }
      } catch (err) {
        showOutput({ error: err.message });
      }
    }

    async function testEndpoint(url) {
      const box = document.getElementById('console-box');
      box.style.display = 'block';
      box.innerHTML = 'Fetching ' + url + '...';
      try {
        const headers = {};
        if (activeToken) headers['Authorization'] = 'Bearer ' + activeToken;
        const res = await fetch(url, { headers });
        const data = await res.json();
        showOutput({ status: res.status, url, response: data });
      } catch (err) {
        showOutput({ error: err.message, url });
      }
    }

    function showOutput(obj) {
      const box = document.getElementById('console-box');
      box.style.display = 'block';
      box.innerHTML = JSON.stringify(obj, null, 2);
    }
  </script>
</body>
</html>`);
};

app.get('/', renderApiDashboard);
app.get('/api/v1', renderApiDashboard);

app.use(errorHandler);

export default app;

if (process.env.NODE_ENV !== 'test') {
  await connectDB();
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`UrbanCool API running on port ${PORT}`));
}
