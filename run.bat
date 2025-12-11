@echo off
REM ============================================
REM Gmail Invoice Extractor - Run Script (Windows)
REM ============================================

REM FIRST TIME SETUP (run these manually once):
REM -----------------------------------------
REM cd backend
REM python -m venv venv
REM venv\Scripts\activate
REM pip install -r requirements.txt
REM copy .env.example .env
REM REM Edit .env with your Google OAuth credentials
REM cd ..
REM
REM cd frontend
REM npm install
REM copy .env.local.example .env.local
REM cd ..
REM -----------------------------------------

echo Starting Gmail Invoice Extractor...
echo.

REM Start Backend in new window
echo Starting Backend on http://localhost:8000
start "Backend" cmd /k "cd /d %~dp0backend && venv\Scripts\activate && uvicorn app.main:app --reload --port 8000"

REM Wait for backend
timeout /t 3 /nobreak > nul

REM Start Frontend in new window
echo Starting Frontend on http://localhost:3000
start "Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ============================================
echo Both servers starting in separate windows!
echo Frontend: http://localhost:3000
echo Backend:  http://localhost:8000
echo API Docs: http://localhost:8000/docs
echo ============================================
echo Close the terminal windows to stop servers
echo.
