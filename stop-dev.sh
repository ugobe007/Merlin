#!/bin/bash

echo "Stopping Merlin development servers..."

# Stop backend
if [ -f logs/backend.pid ]; then
    BACKEND_PID=$(cat logs/backend.pid)
    if kill -0 $BACKEND_PID 2>/dev/null; then
        kill $BACKEND_PID
        echo "✅ Backend server stopped (PID: $BACKEND_PID)"
    else
        echo "⚠️ Backend server was not running"
    fi
    rm logs/backend.pid
fi

# Stop frontend
if [ -f logs/frontend.pid ]; then
    FRONTEND_PID=$(cat logs/frontend.pid)
    if kill -0 $FRONTEND_PID 2>/dev/null; then
        kill $FRONTEND_PID
        echo "✅ Frontend server stopped (PID: $FRONTEND_PID)"
    else
        echo "⚠️ Frontend server was not running"
    fi
    rm logs/frontend.pid
fi

# Also kill any remaining node processes running vite or our server
pkill -f "vite"
pkill -f "server/index.cjs"

echo "🛑 All development servers stopped"