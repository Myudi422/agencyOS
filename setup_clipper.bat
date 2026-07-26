@echo off
setlocal EnableDelayedExpansion

title AgencyOS YT-Clipper Auto Setup
color 0A

:: Selalu pindah ke folder tempat BAT berada
cd /d "%~dp0"

echo ========================================================
echo    AgencyOS YT-Clipper Auto Setup Installer
echo ========================================================
echo.

:: 1. Check Python
echo [1/5] Memeriksa Python...
python --version >nul 2>&1
if !errorlevel! neq 0 (
    echo [!] Python tidak ditemukan. Mengunduh & Menginstall Python otomatis...
    winget install -e --id Python.Python.3.11 --accept-package-agreements --accept-source-agreements

    if !errorlevel! neq 0 (
        echo [X] Gagal install via winget.
        pause
        exit /b 1
    )

    echo [+] Python berhasil terinstall!
) else (
    echo [+] Python terdeteksi.
)

:: 2. Check FFmpeg
echo.
echo [2/5] Memeriksa FFmpeg...
ffmpeg -version >nul 2>&1

if !errorlevel! neq 0 (
    echo [!] FFmpeg tidak ditemukan.
    winget install -e --id Gyan.FFmpeg --accept-package-agreements --accept-source-agreements
) else (
    echo [+] FFmpeg terdeteksi.
)

:: 3. Install Dependencies
echo.
echo [3/5] Menginstal library Python...
python -m pip install --upgrade pip
python -m pip install fastapi uvicorn requests yt-dlp faster-whisper pydantic

:: 4. Download Agent
echo.
echo [4/5] Memeriksa script agen...

if not exist "%~dp0yt_clipper_agent.py" (

    echo [!] Mengunduh yt_clipper_agent.py...

    curl -L "https://raw.githubusercontent.com/Myudi422/agencyOS/main/yt_clipper_agent.py" ^
    -o "%~dp0yt_clipper_agent.py"

    if not exist "%~dp0yt_clipper_agent.py" (

        echo [!] Mencoba PowerShell...

        powershell -Command ^
        "Invoke-WebRequest -Uri 'https://raw.githubusercontent.com/Myudi422/agencyOS/main/yt_clipper_agent.py' -OutFile '%~dp0yt_clipper_agent.py'"

    )
)

if not exist "%~dp0yt_clipper_agent.py" (
    echo.
    echo [X] Gagal mengunduh yt_clipper_agent.py
    pause
    exit /b 1
)

echo [+] Script agen siap.

:: 5. Run Server
echo.
echo ========================================================
echo    Server lokal aktif di http://127.0.0.1:5000
echo    Buka kembali dashboard AgencyOS
echo ========================================================
echo.

python "%~dp0yt_clipper_agent.py"

echo.
echo [!] Server telah berhenti.
pause