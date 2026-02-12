@echo off
title Gestión de Eventos - Levantar en local
cd /d "%~dp0"

if not exist "apps\api\.env" (
  echo [start] Creando apps\api\.env desde .env.example...
  copy "apps\api\.env.example" "apps\api\.env"
  echo [start] Edita apps\api\.env y pone tu DATABASE_URL y JWT_SECRET.
  echo [start] Despues volve a ejecutar: npm run start
  pause
  exit /b 0
)

echo [start] Instalando, migrando DB, sembrando y levantando...
call npm run start
pause
