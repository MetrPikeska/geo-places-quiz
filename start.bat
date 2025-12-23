@echo off
echo Starting Geo Places Quiz Application...
echo.

REM Start backend server in new window
echo Starting backend server on port 3000...
start "Backend Server" cmd /k "cd backend && node server.js"

REM Wait a bit for backend to start
timeout /t 3 /nobreak > nul

REM Open frontend in default browser
echo Opening frontend...
start http://localhost:5500/frontend/

echo.
echo Backend: http://localhost:3000
echo Frontend: http://localhost:5500/frontend/
echo.
echo Press any key to close this window...
pause > nul
