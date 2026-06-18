const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const hierarchyRoutes = require('./routes/hierarchy');
const adminRoutes = require('./routes/adminRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const dashboardDataRoutes = require('./routes/dashboardDataRoutes');
const workspaceRoutes = require('./routes/workspaceRoutes');
const { globalLimiter } = require('./middleware/rateLimit');
const { sessionToken } = require('./middleware/sessionToken');
const errorHandler = require('./middleware/errorHandler');
const { initCleanupTask } = require('./utils/cleanup');
const { seed } = require('./utils/seed');
const { verifyTransporter } = require('./utils/realMailer');
const { initWebSocket } = require('./utils/websocket');

const app = express();
const PORT = process.env.PORT || 5000;

console.log(`[Server] Starting Secure Auth backend in ${process.env.NODE_ENV} mode...`);

// Enable CORS for frontend development server with cookie credentials allowed
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Session-Token']
}));

// Body parsing middleware
app.use(express.json({ limit: '10kb' })); // Limit body size to protect against body bloating attacks
app.use(cookieParser());

// Global Rate Limiting
app.use(globalLimiter);

// Session token validation
app.use(sessionToken);

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/hierarchy', hierarchyRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/dashboard-data', dashboardDataRoutes);
app.use('/api/workspaces', workspaceRoutes);

// Simple healthcheck route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// 404 Route handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Resource not found.' });
});

// Global Error Handler Middleware (MUST be registered last)
app.use(errorHandler);

// Start Periodic cleanup task for unverified 2FA accounts
initCleanupTask();

// Verify SMTP connection (non-blocking)
verifyTransporter();

// Start server
const server = app.listen(PORT, () => {
  console.log(`[Server] Secure Auth backend listening on port ${PORT}...`);
});

// Initialize WebSocket
initWebSocket(server);

// Run seed data (admin account + default widgets)
seed().catch((err) => console.error('[Seed] Error:', err));

// Catch process-level crashes (unhandled rejections/exceptions)
process.on('uncaughtException', (err) => {
  console.error('[CRITICAL] Uncaught Exception occurred at process level:');
  console.error(err);
  // Log details and keep the server running if safe, or shut down gracefully
  // In a robust production environment, you log to external monitoring and restart the container
  console.warn('[Process Control] System recovered. Process was kept alive.');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[CRITICAL] Unhandled Rejection at Promise level:');
  console.error('Promise:', promise);
  console.error('Reason:', reason);
  console.warn('[Process Control] System recovered. Process was kept alive.');
});

// Handle graceful shutdown signals
const gracefulShutdown = () => {
  console.log('[Server] Shutdown signal received. Closing HTTP server...');
  server.close(() => {
    console.log('[Server] HTTP server closed. Exiting process.');
    process.exit(0);
  });
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
