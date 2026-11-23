@echo off
chcp 65001 >nul
cd /d "%~dp0server"
if not exist node_modules call npm install
echo.
echo ==== QUIZ AO VIVO ====
echo Host (voce):   http://localhost:3000/host.html
echo Jogadores (celular na mesma rede Wi-Fi), use um destes IPs:
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do echo    http://%%a:3000/
echo.
echo Senha padrao do admin: admin123  (troque definindo ADMIN_PASSWORD)
echo.
node server.js
pause
