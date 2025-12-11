#!/bin/bash

# ============================================
# Gmail Invoice Extractor - Run Script
# ============================================

# FIRST TIME SETUP (uncomment and run once):
# -----------------------------------------
# # Backend setup
# cd backend
# python -m venv venv
# source venv/Scripts/activate  # Windows Git Bash
# # source venv/bin/activate    # Linux/Mac
# pip install -r requirements.txt
# cp .env.example .env
# # Edit .env with your Google OAuth credentials
# cd ..
#
# # Frontend setup
# cd frontend
# npm install
# cp .env.local.example .env.local
# cd ..
# -----------------------------------------

echo "Starting Gmail Invoice Extractor..."

# Start Backend
echo "Starting Backend on http://localhost:8000"
cd backend
source venv/Scripts/activate 2>/dev/null || source venv/bin/activate
uvicorn app.main:app --reload --port 8000 &
BACKEND_PID=$!
cd ..

# Wait for backend to start
sleep 3

# Start Frontend
echo "Starting Frontend on http://localhost:3000"
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "============================================"
echo "Both servers running!"
echo "Frontend: http://localhost:3000"
echo "Backend:  http://localhost:8000"
echo "API Docs: http://localhost:8000/docs"
echo "============================================"
echo "Press Ctrl+C to stop both servers"
echo ""

# Handle shutdown
trap "echo 'Stopping servers...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" SIGINT SIGTERM

# Wait for both processes
wait
