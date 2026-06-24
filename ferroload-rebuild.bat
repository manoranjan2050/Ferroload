@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion
title Ferroload - Rebuild

set "SCRIPT_DIR=%~dp0"
set "WEB_DIR=%SCRIPT_DIR%web"
set "DIST_DIR=%SCRIPT_DIR%web\dist"

:: ── Load Rust/Cargo into PATH ─────────────────────────────────────────────────
set "CARGO_BIN=%USERPROFILE%\.cargo\bin"
if exist "%CARGO_BIN%\cargo.exe" set "PATH=%CARGO_BIN%;%PATH%"

cls
echo.
echo  =====================================================================
echo   FERROLOAD  -  Force Rebuild
echo  =====================================================================
echo.

:: ── Check Node.js ─────────────────────────────────────────────────────────────
where node >nul 2>&1
if errorlevel 1 (
    echo  [ERROR] Node.js not found! Install from https://nodejs.org
    pause & exit /b 1
)
for /f "tokens=*" %%v in ('node -v 2^>nul') do echo  [OK] Node.js %%v

:: ── Check Cargo ───────────────────────────────────────────────────────────────
where cargo >nul 2>&1
if errorlevel 1 (
    echo  [ERROR] Rust / Cargo not found!
    echo.
    echo  Checked: %CARGO_BIN%\cargo.exe
    echo.
    echo  Opening download page...
    start https://rustup.rs
    echo.
    echo  After installing Rust, close this window and try again.
    pause & exit /b 1
)
for /f "tokens=*" %%v in ('cargo -V 2^>nul') do echo  [OK] %%v
echo.

:: ── Clean old frontend ────────────────────────────────────────────────────────
echo  [1/4] Cleaning old frontend build...
if exist "%DIST_DIR%" rmdir /s /q "%DIST_DIR%"

:: ── npm install ───────────────────────────────────────────────────────────────
echo  [2/4] Installing frontend dependencies...
cd /d "%WEB_DIR%"
call npm install
if errorlevel 1 ( echo  [ERROR] npm install failed! & pause & exit /b 1 )

:: ── npm build ─────────────────────────────────────────────────────────────────
echo  [3/4] Building React frontend...
call npm run build
if errorlevel 1 ( echo  [ERROR] npm build failed! & pause & exit /b 1 )

:: ── cargo build ───────────────────────────────────────────────────────────────
echo  [4/4] Compiling Rust binary...
cd /d "%SCRIPT_DIR%"
cargo build --release -p ferroload-cli
if errorlevel 1 ( echo  [ERROR] Cargo build failed! & pause & exit /b 1 )

echo.
echo  =====================================================================
echo  [DONE] Rebuild complete! Run ferroload.bat to start.
echo  =====================================================================
echo.
pause
