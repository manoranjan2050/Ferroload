@echo off
setlocal enabledelayedexpansion
title Ferroload - Rebuild

set "SCRIPT_DIR=%~dp0"
set "WEB_DIR=%SCRIPT_DIR%web"
set "DIST_DIR=%SCRIPT_DIR%web\dist"

cls
echo.
echo  FERROLOAD  --  Force Rebuild
echo  ─────────────────────────────────────────────────────────────────────────────
echo.

:: ── Check Node.js ───────────────────────────────────────────────────────────────
where node >nul 2>&1
if errorlevel 1 (
    echo  [ERROR] Node.js not found! Install from https://nodejs.org
    pause & exit /b 1
)

:: ── Check Rust ──────────────────────────────────────────────────────────────────
where cargo >nul 2>&1
if errorlevel 1 (
    echo  [ERROR] Cargo not found! Install from https://rustup.rs
    pause & exit /b 1
)

:: ── Clean old frontend dist ─────────────────────────────────────────────────────
echo  [1/4] Cleaning old frontend build...
if exist "%DIST_DIR%" rmdir /s /q "%DIST_DIR%"

:: ── npm install ─────────────────────────────────────────────────────────────────
echo  [2/4] Installing frontend dependencies...
cd /d "%WEB_DIR%"
call npm install
if errorlevel 1 ( echo  [ERROR] npm install failed! & pause & exit /b 1 )

:: ── npm build ───────────────────────────────────────────────────────────────────
echo  [3/4] Building React frontend...
call npm run build
if errorlevel 1 ( echo  [ERROR] npm build failed! & pause & exit /b 1 )

:: ── cargo build ─────────────────────────────────────────────────────────────────
echo  [4/4] Compiling Rust binary...
cd /d "%SCRIPT_DIR%"
cargo build --release -p ferroload-cli
if errorlevel 1 ( echo  [ERROR] Cargo build failed! & pause & exit /b 1 )

echo.
echo  ─────────────────────────────────────────────────────────────────────────────
echo  [DONE] Rebuild complete! Run ferroload.bat to start.
echo  ─────────────────────────────────────────────────────────────────────────────
echo.
pause
