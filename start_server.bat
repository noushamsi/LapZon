@echo off
title LapZon E-Commerce Platform Server
echo ========================================================
echo   Starting LapZon Full-Stack Server
echo   "Quality Products, Trusted Service"
echo ========================================================
echo.
echo Local Storefront & Dashboards: http://localhost:8080
echo Admin Login:   admin@lapkart.com / Admin@123
echo User Login:    customer@gmail.com / User@123
echo.
echo Press Ctrl+C to stop the server at any time.
echo ========================================================
echo.

node server/server.js
pause
