@echo off
chcp 65001 >nul
echo Установка всех библиотек (npm install)...
call npm install
echo.
echo Запуск локального сервера Next.js...
echo Перейди в браузере по адресу: http://localhost:3000
call npm run dev
pause
