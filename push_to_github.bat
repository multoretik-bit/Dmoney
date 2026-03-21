@echo off
chcp 65001 >nul
echo Инициализация локального репозитория...
git init
git add .
git commit -m "Ура! Первый коммит Dmoney MVP"
git branch -M main
git remote add origin https://github.com/multoretik-bit/Dmoney.git
echo Отправка на GitHub...
git push -u origin main
echo.
echo Готово! Код успешно загружен на GitHub.
pause
