@echo off
chcp 65001 >nul
echo.
echo ======================================================
echo   🚀 DMoney: Синхронизация изменений с GitHub
echo ======================================================
echo.

echo 📦 1. Подготовка файлов...
git add .

echo.
echo 📝 2. Создание коммита...
git commit -m "feat: добавлена цель счетов и курсы валют ЦБ РФ"

echo.
echo 📤 3. Отправка на GitHub...
git push

echo.
echo ======================================================
echo   ✅ ГОТОВО! Изменения успешно отправлены.
echo.
echo   ℹ️  НЕ ЗАБУДЬТЕ: 
echo   Выполните этот SQL-запрос в панели Supabase:
echo   ALTER TABLE wallets ADD COLUMN target_amount NUMERIC DEFAULT 0;
echo ======================================================
echo.
pause
