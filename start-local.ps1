Write-Host "========================================================" -ForegroundColor Cyan
Write-Host " Starting VIT CampusOS (Local Non-Docker Environment)" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Cyan

Write-Host "`nStarting Django Backend on port 8000..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; .\venv\Scripts\python.exe manage.py runserver 0.0.0.0:8000"

Write-Host "Starting Vite Frontend on port 5173..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm.cmd run dev"

Write-Host "`nBoth services are starting!" -ForegroundColor Green
Write-Host "• Frontend:    http://localhost:5173" -ForegroundColor White
Write-Host "• Backend API: http://localhost:8000/api/" -ForegroundColor White
Write-Host "• Admin Panel: http://localhost:8000/admin/" -ForegroundColor White
Write-Host "========================================================`n" -ForegroundColor Cyan
