@echo off
setlocal EnableDelayedExpansion

title AgencyOS YT-Clipper Auto Setup
color 0A

:: Selalu jalankan dari folder BAT
cd /d "%~dp0"

echo ========================================================
echo        AgencyOS YT-Clipper Auto Setup
echo ========================================================
echo.

:: ==========================
:: Check Python
:: ==========================
echo [1/4] Memeriksa Python...
python --version >nul 2>&1

if errorlevel 1 (
    echo.
    echo [X] Python belum terinstall.
    echo Silakan install Python terlebih dahulu:
    echo https://www.python.org/downloads/
    pause
    exit /b
)

echo [+] Python ditemukan.

:: ==========================
:: Install Dependencies
:: ==========================
echo.
echo [2/4] Menginstall dependency...

python -m pip install --upgrade pip

python -m pip install ^
fastapi ^
uvicorn ^
requests ^
yt-dlp ^
faster-whisper

:: ==========================
:: Download Agent
:: ==========================
echo.
echo [3/4] Memeriksa yt_clipper_agent.py...

if not exist "%~dp0yt_clipper_agent.py" (

    echo Mengunduh...

    powershell -Command ^
    "Invoke-WebRequest -Uri 'https://raw.githubusercontent.com/Myudi422/agencyOS/main/yt_clipper_agent.py' -OutFile '%~dp0yt_clipper_agent.py'"

)

if not exist "%~dp0yt_clipper_agent.py" (
    echo.
    echo Gagal mengunduh yt_clipper_agent.py
    pause
    exit /b
)

echo [+] Script ditemukan.

:: ==========================
:: Jalankan Server
:: ==========================
echo.
echo ========================================================
echo Server berjalan di:
echo http://127.0.0.1:5000
echo ========================================================
echo.

python "%~dp0yt_clipper_agent.py"

echo.
echo Server berhenti.
pause