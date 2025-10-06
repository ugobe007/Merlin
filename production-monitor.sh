#!/bin/bash

# Merlin Production Monitoring Script
# This script helps monitor and maintain your production deployment

echo "🔍 Merlin Production Status Check"
echo "=================================="

# Check Fly.io app status
echo "📊 Fly.io App Status:"
/Users/robertchristopher/.fly/bin/flyctl status

echo ""
echo "🌐 Testing Application Health:"

# Test main application
echo "🔗 Testing main app: https://merlin.fly.dev"
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://merlin.fly.dev)
if [ $HTTP_STATUS -eq 200 ]; then
    echo "✅ Main application is responding (HTTP $HTTP_STATUS)"
else
    echo "❌ Main application issue (HTTP $HTTP_STATUS)"
fi

# Test API health
echo "🔗 Testing API health: https://merlin.fly.dev/api/db/stats"
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://merlin.fly.dev/api/db/stats)
if [ $API_STATUS -eq 200 ]; then
    echo "✅ API is responding (HTTP $API_STATUS)"
    # Get actual stats
    STATS=$(curl -s https://merlin.fly.dev/api/db/stats)
    echo "📈 Database Stats: $STATS"
else
    echo "❌ API issue (HTTP $API_STATUS)"
fi

echo ""
echo "💡 Maintenance Commands:"
echo "  • Check logs: flyctl logs"
echo "  • Restart app: flyctl machine restart"
echo "  • Deploy updates: flyctl deploy"
echo "  • Scale up: flyctl scale count 2"
echo "  • Monitor: flyctl monitor"

echo ""
echo "🏠 Local Development:"
echo "  • Start dev servers: npm run dev:all"
echo "  • Frontend: http://localhost:5179"
echo "  • Backend: http://localhost:5001"