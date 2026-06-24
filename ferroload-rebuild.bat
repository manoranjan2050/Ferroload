@echo off
setlocal enabledelayedexpansion
title Ferroload - Rebuild

set "SCRIPT_DIR=%~dp0"
set "WEB_DIR=%SCRIPT_DIR%web"
set "DIST_DIR=%SCRIPT_DIR%web\dist"

:: Load user PATH from registry (picks up Rust after fresh install)
for /f "tokens=2*" %%A in ('reg query "HKCU\Environment" /v PATH 2^>nul') do set "USER_PATH=%%B"
if defined USER_PATH set "PATH=%PATH%;%USER_PATH%"

:: Also add cargo bin directly
if exist "%USERPROFILE%\.cargo\bin" set "PATH=%USERPROFILE%\.cargo\bin;%PATH%"

cls
echo.
echo  ============================================================
echo   FERROLOAD - Force Rebuild
echo  ============================================================
echo.

:: Check Node.js
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo  ERROR: Node.js not found. Install from https://nodejs.org
    start https://nodejs.org
    pause
    exit /b 1
)
node -v

:: Check Cargo
where cargo >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo  ERROR: Rust not found. Install from https://rustup.rs
    echo  After installing, close this window and run again.
    start https://rustup.rs
    pause
    exit /b 1
)
cargo -V

echo.

:: Clean frontend
echo  Step 1/4: Cleaning old frontend build...
if exist "%DIST_DIR%" rmdir /s /q "%DIST_DIR%"

:: npm install
echo  Step 2/4: npm install...
cd /d "%WEB_DIR%"
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo  ERROR: npm install failed.
    pause
    exit /b 1
)

:: npm build
echo  Step 3/4: npm run build...
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo  ERROR: npm build failed.
    pause
    exit /b 1
)

:: cargo build
echo  Step 4/4: cargo build --release...
cd /d "%SCRIPT_DIR%"
cargo build --release -p ferroload-cli
if %ERRORLEVEL% NEQ 0 (
    echo  ERROR: Cargo build failed.
    pause
    exit /b 1
)

echo.
echo  ============================================================
echo   Rebuild complete! Run ferroload.bat to start.
echo  ============================================================
echo.
pause
