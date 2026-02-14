require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const apiRoutes = require('./routes/api');
const { startScheduler } = require('./scheduler/scheduler');
const { resolveConfig } = require('./api/config-resolver');
const { getCredentials, getSetting } = require('./db/database');

// Set timezone from DB (defaults to Europe/Paris)
process.env.TZ = getSetting('timezone', 'Europe/Paris');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// API routes
app.use('/api', apiRoutes);

// SPA fallback
app.get('/{*path}', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

const server = app.listen(PORT, async () => {
  console.log(`Foot Du Lundi running at http://localhost:${PORT}`);

  // Only resolve config if credentials are already configured
  const creds = getCredentials();
  if (creds) {
    try {
      await resolveConfig();
      console.log('[Config] Configuration resolved successfully');
    } catch (err) {
      console.error(`[Config] Failed to resolve config: ${err.message}`);
      console.error('[Config] Payment features will not work until config is resolved');
    }
  } else {
    console.log('[Config] No credentials configured — waiting for setup via the web interface');
  }

  startScheduler();
});

// Graceful shutdown — wait for in-flight requests (payments, Playwright) before exiting
function shutdown(signal) {
  console.log(`[Server] ${signal} received, shutting down gracefully...`);
  server.close(() => {
    console.log('[Server] HTTP server closed');
    process.exit(0);
  });
  // Force exit after 30s if something hangs (e.g. stuck Playwright instance)
  setTimeout(() => {
    console.error('[Server] Forced shutdown after timeout');
    process.exit(1);
  }, 30_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
