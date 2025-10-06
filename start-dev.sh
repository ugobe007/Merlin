#!/bin/bash

# Start development servers in the background
echo "Starting Merlin development servers..."

# Start backend server
echo "Starting backend server on port 5001..."
cd /Users/robertchristopher/merlin
node server/index.cjs > logs/backend.log 2>&1 &
BACKEND_PID=$!
echo "Backend started with PID: $BACKEND_PID"

# Wait a moment for backend to start
sleep 2

# Start frontend server
echo "Starting frontend server..."
npm run dev > logs/frontend.log 2>&1 &
FRONTEND_PID=$!
echo "Frontend started with PID: $FRONTEND_PID"

# Save PIDs for later stopping
echo $BACKEND_PID > logs/backend.pid
echo $FRONTEND_PID > logs/frontend.pid

echo ""
echo "✅ Development servers started!"
echo "📊 Backend: http://localhost:5001"
echo "🎨 Frontend: http://localhost:5176+ (check logs for exact port)"
echo ""
echo "To stop servers, run: ./stop-dev.sh"
echo "To view logs: tail -f logs/backend.log or logs/frontend.log"