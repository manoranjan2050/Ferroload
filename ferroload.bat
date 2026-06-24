@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion
title Ferroload

set "SCRIPT_DIR=%~dp0"
set "BINARY=%SCRIPT_DIR%target\release\ferroload.exe"
set "WEB_DIR=%SCRIPT_DIR%web"
set "DIST_DIR=%SCRIPT_DIR%web\dist"

:: ── Load Rust/Cargo into PATH (works even without restarting cmd) ──────────────
set "CARGO_BIN=%USERPROFILE%\.cargo\bin"
if exist "%CARGO_BIN%\cargo.exe" set "PATH=%CARGO_BIN%;%PATH%"

cls
echo.
echo  =====================================================================
echo   FERROLOAD  -  Fast, Beautiful, Open-Source BitTorrent Client
echo  =====================================================================
echo.

:: Already built? Skip everything.
if exist "%BINARY%" goto :RUN

echo  [BUILD] First-time setup. This will take a few minutes...
echo.

:: ── Check Node.js ─────────────────────────────────────────────────────────────
where node >nul 2>&1
if errorlevel 1 (
    echo  [ERROR] Node.js not found!
    echo.
    echo  Please install Node.js 18+ from:
    echo    https://nodejs.org
    echo.
    pause & exit /b 1
)
for /f "tokens=*" %%v in ('node -v 2^>nul') do echo  [OK] Node.js %%v found

:: ── Check Cargo ───────────────────────────────────────────────────────────────
where cargo >nul 2>&1
if errorlevel 1 (
    echo  [ERROR] Rust / Cargo not found!
    echo.
    echo  Checked: %CARGO_BIN%\cargo.exe
    echo.
    echo  Please install Rust from:
    echo    https://rustup.rs
    echo.
    echo  Opening download page...
    start https://rustup.rs
    echo.
    echo  After installing Rust, close this window and run ferroload.bat again.
    echo.
    pause & exit /b 1
)
for /f "tokens=*" %%v in ('cargo -V 2^>nul') do echo  [OK] %%v found
echo.

:: ── Build frontend ────────────────────────────────────────────────────────────
if not exist "%DIST_DIR%" (
    echo  [1/3] Installing frontend dependencies (npm install)...
    cd /d "%WEB_DIR%"
    call npm install
    if errorlevel 1 ( echo  [ERROR] npm install failed! & pause & exit /b 1 )

    echo.
    echo  [2/3] Building React frontend (npm run build)...
    call npm run build
    if errorlevel 1 ( echo  [ERROR] npm build failed! & pause & exit /b 1 )
    cd /d "%SCRIPT_DIR%"
) else (
    echo  [1/3] Frontend already built, skipping.
    echo  [2/3] Skipped.
)

:: ── Build Rust binary ─────────────────────────────────────────────────────────
echo.
echo  [3/3] Compiling Rust binary (first build may take 5-10 minutes)...
cd /d "%SCRIPT_DIR%"
cargo build --release -p ferroload-cli
if errorlevel 1 (
    echo.
    echo  [ERROR] Rust build failed! See errors above.
    pause & exit /b 1
)

echo.
echo  =====================================================================
echo  [DONE] Build complete!
echo  =====================================================================
echo.

:RUN
echo  Starting Ferroload...
echo  Dashboard -> http://localhost:7070
echo  Press Ctrl+C to stop.
echo  ---------------------------------------------------------------------
echo.

start "" cmd /c "timeout /t 2 /nobreak >nul && start http://localhost:7070"
"%BINARY%"

echo.
echo  Ferroload stopped.
pause
