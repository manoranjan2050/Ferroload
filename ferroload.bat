@echo off
setlocal enabledelayedexpansion
title Ferroload

:: ─────────────────────────────────────────────
::  FERROLOAD LAUNCHER
::  Builds frontend + backend if needed, then runs
:: ─────────────────────────────────────────────

set "SCRIPT_DIR=%~dp0"
set "BINARY=%SCRIPT_DIR%target\release\ferroload.exe"
set "WEB_DIR=%SCRIPT_DIR%web"
set "DIST_DIR=%SCRIPT_DIR%web\dist"

cls
echo.
echo  ███████╗███████╗██████╗ ██████╗  ██████╗ ██╗      ██████╗  █████╗ ██████╗
echo  ██╔════╝██╔════╝██╔══██╗██╔══██╗██╔═══██╗██║     ██╔═══██╗██╔══██╗██╔══██╗
echo  █████╗  █████╗  ██████╔╝██████╔╝██║   ██║██║     ██║   ██║███████║██║  ██║
echo  ██╔══╝  ██╔══╝  ██╔══██╗██╔══██╗██║   ██║██║     ██║   ██║██╔══██║██║  ██║
echo  ██║     ███████╗██║  ██║██║  ██║╚██████╔╝███████╗╚██████╔╝██║  ██║██████╔╝
echo  ╚═╝     ╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝ ╚═════╝ ╚═╝  ╚═╝╚═════╝
echo.
echo                    Fast, Beautiful, Open-Source BitTorrent Client
echo  ─────────────────────────────────────────────────────────────────────────────
echo.

:: ── Check if release binary already exists ─────────────────────────────────────
if exist "%BINARY%" (
    echo  [OK] Binary found. Skipping build.
    goto :RUN
)

echo  [BUILD] Binary not found. Starting first-time build...
echo.

:: ── Check Node.js ───────────────────────────────────────────────────────────────
where node >nul 2>&1
if errorlevel 1 (
    echo  [ERROR] Node.js not found!
    echo.
    echo  Please install Node.js 18+ from: https://nodejs.org
    echo.
    pause
    exit /b 1
)

:: ── Check Rust/Cargo ────────────────────────────────────────────────────────────
where cargo >nul 2>&1
if errorlevel 1 (
    echo  [ERROR] Rust / Cargo not found!
    echo.
    echo  Please install Rust from: https://rustup.rs
    echo.
    pause
    exit /b 1
)

:: ── Build frontend ──────────────────────────────────────────────────────────────
if not exist "%DIST_DIR%" (
    echo  [1/3] Installing frontend dependencies...
    cd /d "%WEB_DIR%"
    call npm install
    if errorlevel 1 (
        echo  [ERROR] npm install failed!
        pause
        exit /b 1
    )

    echo.
    echo  [2/3] Building React frontend...
    call npm run build
    if errorlevel 1 (
        echo  [ERROR] npm build failed!
        pause
        exit /b 1
    )
    cd /d "%SCRIPT_DIR%"
) else (
    echo  [1/3] Frontend already built. Skipping.
    echo  [2/3] Skipped.
)

:: ── Build Rust binary ───────────────────────────────────────────────────────────
echo.
echo  [3/3] Compiling Rust binary (this may take a few minutes first time)...
cd /d "%SCRIPT_DIR%"
cargo build --release -p ferroload-cli
if errorlevel 1 (
    echo.
    echo  [ERROR] Rust build failed! Check the errors above.
    pause
    exit /b 1
)

echo.
echo  ─────────────────────────────────────────────────────────────────────────────
echo  [OK] Build complete!
echo  ─────────────────────────────────────────────────────────────────────────────
echo.

:: ── Run ────────────────────────────────────────────────────────────────────────
:RUN
echo.
echo  Starting Ferroload...
echo  Dashboard → http://localhost:7070
echo.
echo  Press Ctrl+C to stop.
echo  ─────────────────────────────────────────────────────────────────────────────
echo.

:: Small delay then open browser
start "" cmd /c "timeout /t 2 /nobreak >nul && start http://localhost:7070"

:: Run the binary
"%BINARY%"

echo.
echo  Ferroload stopped.
pause
