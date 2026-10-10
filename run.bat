@echo off
title VIT CampusOS - One Click Launcher
cd /d "%~dp0"

echo ========================================================
echo        VIT CampusOS - One-Click Server Launcher
echo ========================================================
echo.

:: 1. Verify / Setup Backend
echo [1/3] Checking Django Backend Environment...
if not exist "backend\venv\Scripts\python.exe" (
    echo Virtual environment not found. Creating backend\venv...
    python -m venv backend\venv
    call backend\venv\Scripts\pip.exe install -r backend\requirements.txt
)

:: Run migrations if needed
call backend\venv\Scripts\python.exe backend\manage.py migrate --noinput >nul 2>&1

:: 2. Verify / Setup Frontend
echo [2/3] Checking React Frontend Environment...
if not exist "frontend\node_modules" (
    echo Node modules not found. Installing frontend dependencies...
    cd frontend && call npm.cmd install && cd ..
)

:: 3. Launch Services concurrently in separate command windows
echo [3/3] Launching Background Servers...
echo   - Starting Django Backend on http://localhost:8000
start "VITOS Backend Server (Port 8000)" cmd /k "cd /d "%~dp0backend" && .\venv\Scripts\python.exe manage.py runserver 0.0.0.0:8000"

echo   - Starting Vite Frontend on http://localhost:5173
start "VITOS Frontend Server (Port 5173)" cmd /k "cd /d "%~dp0frontend" && npm.cmd run dev"

:: Wait a brief moment and launch default browser
timeout /t 3 /nobreak >nul
start http://localhost:5173

echo.
echo ========================================================
echo  All services are up and running!
echo  - Frontend Application:  http://localhost:5173
echo  - Backend REST API:      http://localhost:8000/api/
echo  - Django Admin:          http://localhost:8000/admin/
echo.
echo  You can close this launcher window anytime.
echo  (The server windows will stay active in the background)
echo ========================================================
pause >nul
