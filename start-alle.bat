@echo off
echo Starter GIF Hold-Helte...
start "Backend" cmd /k "cd /d "%~dp0server" && node index.js"
timeout /t 2 /nobreak >nul
start "Frontend" cmd /k "cd /d "%~dp0client" && npm run dev"
echo.
echo ========================================
echo   Backend:  http://localhost:3001/api
echo   Frontend: http://localhost:5173
echo ========================================
echo.
echo Begge vinduer er aabnet!
pause
