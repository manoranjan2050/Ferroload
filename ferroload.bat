@echo off
setlocal enabledelayedexpansion
title Ferroload

set "SCRIPT_DIR=%~dp0"
set "BINARY=%SCRIPT_DIR%target\release\ferroload.exe"
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
echo   FERROLOAD - Fast, Beautiful, Open-Source BitTorrent Client
echo  ============================================================
echo.

if exist "%BINARY%" goto RUN

echo  First-time setup starting...
echo.

:: Check Node.js
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo  ERROR: Node.js not found.
    echo  Install from: https://nodejs.org
    echo.
    start https://nodejs.org
    pause
    exit /b 1
)
node -v

:: Check Cargo
where cargo >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo  ERROR: Rust not found.
    echo  Install from: https://rustup.rs
    echo  After installing, close this window and run again.
    echo.
    start https://rustup.rs
    pause
    exit /b 1
)
cargo -V

echo.

:: Build frontend if needed
if not exist "%DIST_DIR%" (
    echo  Step 1/3: npm install...
    cd /d "%WEB_DIR%"
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo  ERROR: npm install failed.
        pause
        exit /b 1
    )
    echo.
    echo  Step 2/3: npm run build...
    call npm run build
    if %ERRORLEVEL% NEQ 0 (
        echo  ERROR: npm build failed.
        pause
        exit /b 1
    )
    cd /d "%SCRIPT_DIR%"
) else (
    echo  Step 1/3: Frontend already built, skipping.
    echo  Step 2/3: Skipped.
)

echo.
echo  Step 3/3: Compiling Rust binary (may take 5-10 min first time)...
cd /d "%SCRIPT_DIR%"
cargo build --release -p ferroload-cli
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo  ERROR: Cargo build failed. See output above.
    pause
    exit /b 1
)

echo.
echo  ============================================================
echo   Build complete!
echo  ============================================================
echo.

:RUN
echo  Starting Ferroload at http://localhost:7070
echo  Press Ctrl+C to stop.
echo  ------------------------------------------------------------
echo.
start "" cmd /c "timeout /t 2 /nobreak >nul && start http://localhost:7070"
"%BINARY%"
echo.
echo  Ferroload stopped.
pause
