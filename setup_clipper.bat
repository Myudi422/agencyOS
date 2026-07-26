@echo off
setlocal EnableDelayedExpansion

title AgencyOS YT-Clipper Auto Setup
color 0A

:: =====================================================
:: Selalu gunakan folder tempat BAT berada
:: =====================================================
cd /d "%~dp0"

echo ========================================================
echo        AgencyOS YT-Clipper Auto Setup
echo ========================================================
echo.

:: =====================================================
:: Cari Python
:: =====================================================
echo [1/4] Memeriksa Python...

set "PYTHON_EXE="

for /f "delims=" %%P in ('where python 2^>nul') do (
    set "PYTHON_EXE=%%P"
    goto :python_found
)

echo.
echo [X] Python tidak ditemukan.
echo Silakan install Python terlebih dahulu.
echo https://www.python.org/downloads/
pause
exit /b 1

:python_found

echo [+] Python ditemukan:
echo     !PYTHON_EXE!
echo.

:: =====================================================
:: Install Dependencies
:: =====================================================
echo [2/4] Menginstall dependency...

"!PYTHON_EXE!" -m pip install --upgrade pip

"!PYTHON_EXE!" -m pip install ^
fastapi ^
uvicorn ^
requests ^
yt-dlp ^
faster-whisper

:: =====================================================
:: Download Agent
:: =====================================================
echo.
echo [3/4] Memeriksa yt_clipper_agent.py...

if not exist "%~dp0yt_clipper_agent.py" (

    echo Mengunduh backend...

    powershell -NoProfile -ExecutionPolicy Bypass -Command ^
    "Invoke-WebRequest -UseBasicParsing -Uri 'https://raw.githubusercontent.com/Myudi422/agencyOS/main/yt_clipper_agent.py' -OutFile '%~dp0yt_clipper_agent.py'"

)

if not exist "%~dp0yt_clipper_agent.py" (
    echo.
    echo [X] Gagal mengunduh yt_clipper_agent.py
    pause
    exit /b 1
)

echo [+] Backend ditemukan.

:: =====================================================
:: Jalankan Server
:: =====================================================
echo.
echo [4/4] Menjalankan Local Engine Server...
echo ========================================================
echo Folder  : %CD%
echo Python  : !PYTHON_EXE!
echo Script  : %~dp0yt_clipper_agent.py
echo ========================================================
echo.

pushd "%~dp0"

"!PYTHON_EXE!" "%~dp0yt_clipper_agent.py"

set EXITCODE=%ERRORLEVEL%

popd

echo.
echo ========================================================
echo Server telah berhenti.
echo Exit Code : %EXITCODE%
echo ========================================================
pause