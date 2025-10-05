#!/usr/bin/env node

// Railway startup script
const path = require('path');
const { spawn } = require('child_process');

console.log('[railway] Starting Merlin BESS Quote Builder...');
console.log('[railway] Current working directory:', process.cwd());
console.log('[railway] Environment:', process.env.NODE_ENV);
console.log('[railway] Port:', process.env.PORT || '5001');

// Ensure we're in the right directory
process.chdir(__dirname);

// Start the server
const serverPath = path.join(__dirname, 'server', 'index.cjs');
console.log('[railway] Starting server from:', serverPath);

const server = spawn('node', [serverPath], {
  stdio: 'inherit',
  env: { ...process.env, NODE_ENV: 'production' }
});

server.on('error', (error) => {
  console.error('[railway] Failed to start server:', error);
  process.exit(1);
});

server.on('close', (code) => {
  console.log(`[railway] Server process exited with code ${code}`);
  process.exit(code);
});

// Handle shutdown gracefully
process.on('SIGTERM', () => {
  console.log('[railway] Received SIGTERM, shutting down gracefully');
  server.kill('SIGTERM');
});

process.on('SIGINT', () => {
  console.log('[railway] Received SIGINT, shutting down gracefully');
  server.kill('SIGINT');
});