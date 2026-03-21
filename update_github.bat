@echo off
chcp 65001 >nul
echo Добавление новых изменений (исправленные ошибки сборки)...
git add .
git commit -m "Fix Next.js build errors (unused variables)"
echo Отправка на GitHub...
git push
echo.
echo Готово! Код успешно загружен на GitHub. Ждите сборку на Vercel!
pause
